import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  StateGraph,
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import {
  getCampusPlaceBundle,
  getRelevantPlaceBundleFromResults,
  searchCampusData,
} from "./vectorStore.js";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 1. Define the State (What the bot carries through the conversation)
const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});





// 2. Initialize Tools (Groq for LLM, Tavily for Web Search)
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY, // Free API Key from console.groq.com
  model: "llama-3.1-8b-instant",
  temperature: 0.1, // Keep it factual for campus data
});

const webSearchTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY, // Free API Key from tavily.com
  maxResults: 3,
});

// 3. NODE: Local JSON Search Logic
const callLocalData = async (state) => {
  const lastUserMsg = state.messages[state.messages.length - 1].content;
  const placeBundle = getCampusPlaceBundle(lastUserMsg);
  console.log(`🔎 Searching local campus data for: ${lastUserMsg}`);

  // Search the 8-9 JSON files indexed in vectorStore.js
  const searchResults = await searchCampusData(lastUserMsg, 4);
  const resultBundle = getRelevantPlaceBundleFromResults(lastUserMsg, searchResults);
  console.log(`Found ${searchResults.length} local matches. Best score: ${searchResults[0]?.[1]}`);

  // MemoryVectorStore returns cosine similarity, so higher score means a closer match.
  const bestMatch = searchResults[0]?.[0]; // The Document
  const score = searchResults[0]?.[1]; // The Similarity Score

  // Threshold: accept reasonably similar matches from local campus data, or a
  // deterministic place bundle when the query clearly points to a campus place.
  if (placeBundle || (bestMatch && score > 0.3)) {
    const context = searchResults
      .map(([doc, docScore], index) => `Match ${index + 1} (similarity ${docScore.toFixed(3)}):\n${doc.pageContent}`)
      .join("\n\n");
    const bundleContext = placeBundle
      ? `
Structured Destination Bundle:
- Destination: ${placeBundle.destination.name} (${placeBundle.destination.code})
- Description: ${placeBundle.destination.description}
- Zone: ${placeBundle.destination.zone}
- Floors: ${placeBundle.destination.floors}
- Coordinates: lat ${placeBundle.destination.coordinates.lat}, lng ${placeBundle.destination.coordinates.lng}
- Nearby: ${(placeBundle.destination.nearby || []).join(", ")}
- Route Label: ${placeBundle.route?.label || "Not available"}
- Route Summary: ${placeBundle.route?.summary || "Not available"}
- Route Distance: ${placeBundle.route?.distance_m || "Unknown"} metres
- Route Time: ${placeBundle.route?.walk_minutes || "Unknown"} minutes
- Related Departments: ${(placeBundle.related_departments || [])
        .map((department) => `${department.name}${department.floor !== undefined ? ` (floor ${department.floor})` : ""}`)
        .join(", ")}
`
      : "";

    const response = await llm.invoke([
      new SystemMessage(`
        You are the Parul University Campus Assistant. 
        Use the provided Internal Data to answer the student.
        If the query is about a place, combine the place information, location,
        coordinates, and route/path guidance when available.
        If the data doesn't contain the answer, reply EXACTLY with: NOT_FOUND_IN_DATA
      `),
      ...state.messages.slice(-3), // Pass last 3 messages for context
      new HumanMessage(`Internal Data: ${context}\n\n${bundleContext}\nQuestion: ${lastUserMsg}`),
    ]);

    if (!response.content.includes("NOT_FOUND_IN_DATA")) {
      const responseMetadata = resultBundle || placeBundle || bestMatch?.metadata || null;
      return {
        messages: [
          new AIMessage({
            content: response.content,
            additional_kwargs: {
              metadata: responseMetadata,
            },
          }),
        ],
      };
    }
  }

  // If match is poor, signal for Web Search
  return { messages: [new AIMessage("NOT_FOUND_IN_DATA")] };
};

// 4. NODE: Web Search Fallback
const callWebSearch = async (state) => {
  // Get the original question (the message before the NOT_FOUND signal)
  const userQuery = state.messages[state.messages.length - 2].content;

  console.log(`🔍 Not in JSON. Searching web for: ${userQuery}`);
  const webContent = await webSearchTool.invoke(userQuery);

  const response = await llm.invoke([
    new SystemMessage(
      "You are a helpful Campus Assistant. The requested info wasn't in our local database, so here is web info. Summarize it accurately for the student.",
    ),
    new HumanMessage(`Web Results: ${webContent}\n\nQuestion: ${userQuery}`),
  ]);

  return { messages: [response] };
};

// 5. BUILD THE GRAPH (The Routing Logic)
const workflow = new StateGraph(GraphState)
  .addNode("local_search", callLocalData)
  .addNode("web_search", callWebSearch)
  .setEntryPoint("local_search")

  // Decision: Only go to Web Search if Local Search returns "NOT_FOUND_IN_DATA"
  .addConditionalEdges("local_search", (state) => {
    const lastMsg = state.messages[state.messages.length - 1].content;
    return lastMsg === "NOT_FOUND_IN_DATA" ? "web_search" : "__end__";
  })
  .addEdge("web_search", "__end__");

// 6. Memory Checkpointer (This handles the Sessions/Thread IDs)
const checkpointer = new MemorySaver();

// Export the compiled graph
export const campusBot = workflow.compile({ checkpointer });
