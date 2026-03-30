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
import { getWebAnswer } from "../../webCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.1,
});

const callLocalData = async (state) => {
  const lastUserMsg = state.messages[state.messages.length - 1].content;
  const placeBundle = getCampusPlaceBundle(lastUserMsg);
  console.log(`Searching local campus data for: ${lastUserMsg}`);

  const searchResults = await searchCampusData(lastUserMsg, 4);
  const resultBundle = getRelevantPlaceBundleFromResults(
    lastUserMsg,
    searchResults,
  );
  console.log(
    `Found ${searchResults.length} local matches. Best score: ${searchResults[0]?.[1]}`,
  );

  const bestMatch = searchResults[0]?.[0];
  const score = searchResults[0]?.[1];

  if (placeBundle || (bestMatch && score > 0.3)) {
    const context = searchResults
      .map(
        ([doc, docScore], index) =>
          `Match ${index + 1} (similarity ${docScore.toFixed(3)}):\n${doc.pageContent}`,
      )
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
          .map(
            (department) =>
              `${department.name}${
                department.floor !== undefined ? ` (floor ${department.floor})` : ""
              }`,
          )
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
      ...state.messages.slice(-3),
      new HumanMessage(
        `Internal Data: ${context}\n\n${bundleContext}\nQuestion: ${lastUserMsg}`,
      ),
    ]);

    if (!response.content.includes("NOT_FOUND_IN_DATA")) {
      const responseMetadata =
        resultBundle || placeBundle || bestMatch?.metadata || null;

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

  return { messages: [new AIMessage("NOT_FOUND_IN_DATA")] };
};

const callWebSearch = async (state) => {
  const userQuery = state.messages[state.messages.length - 2].content;

  console.log(`Using curated web source fallback for: ${userQuery}`);
  const webAnswer = await getWebAnswer(userQuery);

  if (!webAnswer) {
    return {
      messages: [
        new AIMessage({
          content:
            "I couldn't find that in our internal data or curated web sources right now.",
          additional_kwargs: { metadata: null },
        }),
      ],
    };
  }

  if (webAnswer.is_url_only) {
    return {
      messages: [
        new AIMessage({
          content: `I found the most relevant official source for this: ${webAnswer.source_label}. You can check it here: ${webAnswer.source_url}`,
          additional_kwargs: {
            metadata: {
              type: "web_source",
              source_label: webAnswer.source_label,
              source_url: webAnswer.source_url,
              cached: webAnswer.cached,
              is_url_only: true,
              disclosure: webAnswer.disclosure || null,
            },
          },
        }),
      ],
    };
  }

  const response = await llm.invoke([
    new SystemMessage(
      "You are a helpful Campus Assistant. The requested info wasn't in our local database, so use the curated web source content below. Summarize it accurately for the student and stay grounded in the provided source.",
    ),
    new HumanMessage(
      `Source Label: ${webAnswer.source_label}\nSource URL: ${webAnswer.source_url}\nCached: ${webAnswer.cached}\nDisclosure: ${webAnswer.disclosure || "None"}\n\nWeb Content: ${webAnswer.content}\n\nQuestion: ${userQuery}`,
    ),
  ]);

  return {
    messages: [
      new AIMessage({
        content: response.content,
        additional_kwargs: {
          metadata: {
            type: "web_source",
            source_label: webAnswer.source_label,
            source_url: webAnswer.source_url,
            cached: webAnswer.cached,
            scraped_at: webAnswer.scraped_at || null,
            disclosure: webAnswer.disclosure || null,
          },
        },
      }),
    ],
  };
};

const workflow = new StateGraph(GraphState)
  .addNode("local_search", callLocalData)
  .addNode("web_search", callWebSearch)
  .setEntryPoint("local_search")
  .addConditionalEdges("local_search", (state) => {
    const lastMsg = state.messages[state.messages.length - 1].content;
    return lastMsg === "NOT_FOUND_IN_DATA" ? "web_search" : "__end__";
  })
  .addEdge("web_search", "__end__");

const checkpointer = new MemorySaver();

export const campusBot = workflow.compile({ checkpointer });
