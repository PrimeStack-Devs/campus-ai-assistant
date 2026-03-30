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
import {
  CAMPUS_ASSISTANT_SYSTEM_PROMPT,
  WEB_FALLBACK_SYSTEM_PROMPT,
  NOT_FOUND_PROMPT,
  FORMAT_LOCATION,
  FORMAT_DIRECTIONS,
  FORMAT_PERSON,
  FORMAT_SERVICE,
  FORMAT_POLICY,
} from "../../utils/prompts.js";
import { applyGuardrails, detectQueryType } from "../../utils/guardrails.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * VECTOR_SCORE_THRESHOLD
 *
 * MemoryVectorStore.similaritySearchWithScore() returns cosine SIMILARITY.
 * Higher = more similar. Range: 0.0 to 1.0.
 *
 * 0.55 = we need at least 55% similarity to trust local vector results.
 * Below this, the query likely has no good local match → fall to web search.
 *
 * Tune this value if you observe too many false positives (lower it)
 * or too many unnecessary web fallbacks (raise it).
 */
const VECTOR_SCORE_THRESHOLD = 0.55;

/**
 * LOCATION_INTENT_PATTERN
 *
 * Used to guard getCampusPlaceBundle() — only trust its result
 * when the user is actually asking about a location.
 *
 * Without this guard, queries like "placement stats" or "hostel fee"
 * would match a building via keyword scoring and incorrectly suppress
 * the web search fallback.
 */
const LOCATION_INTENT_PATTERN =
  /\b(where (is|are|can i find|do i go)|location (of|for)|find|how to (reach|get to|find)|directions? (to|for)|route (to|from)|nearest|which (block|building|floor)|take me to)\b/i;

// ─── Format Template Map ──────────────────────────────────────────────────────

const FORMAT_MAP = {
  location: FORMAT_LOCATION,
  directions: FORMAT_DIRECTIONS,
  person: FORMAT_PERSON,
  service: FORMAT_SERVICE,
  policy: FORMAT_POLICY,
};

function buildSystemPrompt(queryType) {
  const template = FORMAT_MAP[queryType];
  if (!template) return CAMPUS_ASSISTANT_SYSTEM_PROMPT;
  return `${CAMPUS_ASSISTANT_SYSTEM_PROMPT}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n${template}`;
}

// ─── Graph State ──────────────────────────────────────────────────────────────

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

// ─── LLM ─────────────────────────────────────────────────────────────────────

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.1,
});

// ─── Node 1: Local Data Search ────────────────────────────────────────────────

const callLocalData = async (state) => {
  const lastUserMsg = state.messages[state.messages.length - 1].content;
  const queryType = detectQueryType(lastUserMsg);
  const systemPrompt = buildSystemPrompt(queryType);

  console.log(
    `[Graph] Local search | query: "${lastUserMsg}" | type: ${queryType}`,
  );

  // ── Routing Decision 1: Place Bundle ────────────────────────────────────────
  // Only use getCampusPlaceBundle() when the query has clear location intent.
  // Without this guard, keyword scoring returns a building for almost any query
  // (e.g. "placement stats" matches "Placement Cell → C2") and incorrectly
  // suppresses the web fallback.
  const isLocationQuery = LOCATION_INTENT_PATTERN.test(lastUserMsg);
  const placeBundle = isLocationQuery
    ? getCampusPlaceBundle(lastUserMsg)
    : null;

  if (placeBundle) {
    console.log(
      `[Graph] Place bundle matched: ${placeBundle.destination.name}`,
    );
  } else if (!isLocationQuery) {
    console.log(`[Graph] Skipping place bundle — not a location query`);
  }

  // ── Semantic Vector Search ───────────────────────────────────────────────────
  const searchResults = await searchCampusData(lastUserMsg, 4);
  const bestScore = searchResults[0]?.[1] ?? 0;
  const bestMatch = searchResults[0]?.[0];

  console.log(
    `[Graph] Vector search | results: ${searchResults.length} | best score: ${bestScore.toFixed(3)} | threshold: ${VECTOR_SCORE_THRESHOLD}`,
  );

  // ── Routing Decision 2: Vector Match ─────────────────────────────────────────
  // MemoryVectorStore returns cosine SIMILARITY (higher = better).
  // Only proceed with local data if score clears the threshold.
  const hasGoodVectorMatch = bestMatch && bestScore >= VECTOR_SCORE_THRESHOLD;

  // ── Route: No local data → Web search ────────────────────────────────────────
  if (!placeBundle && !hasGoodVectorMatch) {
    console.log(
      `[Graph] No confident local match (score: ${bestScore.toFixed(3)}) → routing to web search`,
    );
    return { messages: [new AIMessage("NOT_FOUND_IN_DATA")] };
  }

  // ── Build Context for LLM ────────────────────────────────────────────────────
  const resultBundle = getRelevantPlaceBundleFromResults(
    lastUserMsg,
    searchResults,
  );

  const context = searchResults
    .map(
      ([doc, docScore], index) =>
        `Match ${index + 1} (score: ${docScore.toFixed(3)}):\n${doc.pageContent}`,
    )
    .join("\n\n");

  const bundleContext = placeBundle
    ? `
Structured Campus Data Bundle:
- Building: ${placeBundle.destination.name} (${placeBundle.destination.code})
- Description: ${placeBundle.destination.description}
- Zone: ${placeBundle.destination.zone}
- Floors: ${placeBundle.destination.floors}
- Coordinates: lat ${placeBundle.destination.coordinates.lat}, lng ${placeBundle.destination.coordinates.lng}
- Nearby buildings: ${(placeBundle.destination.nearby || []).join(", ")}
- Route label: ${placeBundle.route?.label || "Not available"}
- Route summary: ${placeBundle.route?.summary || "Not available"}
- Walking distance: ${placeBundle.route?.distance_m ?? "Unknown"} metres
- Walking time: ${placeBundle.route?.walk_minutes ?? "Unknown"} minutes
- Departments inside: ${
        (placeBundle.related_departments || [])
          .map(
            (d) =>
              `${d.name}${d.floor !== undefined ? ` (Floor ${d.floor})` : ""}`,
          )
          .join(", ") || "None listed"
      }
`.trim()
    : "";

  // ── LLM Call ─────────────────────────────────────────────────────────────────
  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.slice(-3),
    new HumanMessage(
      [
        `Campus Data:\n${context}`,
        bundleContext ? `Place Bundle:\n${bundleContext}` : "",
        `Student Question: ${lastUserMsg}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  ]);

  // ── NOT_FOUND_IN_DATA check ───────────────────────────────────────────────────
  // Must be an exact trim match — LLM sometimes wraps the token in a sentence.
  // The system prompt instructs it not to, but we guard here too.
  if (response.content.trim() === "NOT_FOUND_IN_DATA") {
    console.log("[Graph] LLM signalled NOT_FOUND → routing to web search");
    return { messages: [new AIMessage("NOT_FOUND_IN_DATA")] };
  }

  const responseMetadata =
    resultBundle || placeBundle || bestMatch?.metadata || null;

  return {
    messages: [
      new AIMessage({
        content: response.content,
        additional_kwargs: {
          metadata: responseMetadata,
          query_type: queryType,
          source: "local",
        },
      }),
    ],
  };
};

// ─── Node 2: Web Search Fallback ──────────────────────────────────────────────

const callWebSearch = async (state) => {
  // Original user query is at length - 2
  // (length - 1 is the NOT_FOUND_IN_DATA signal message)
  const userQuery = state.messages[state.messages.length - 2].content;

  console.log(`[Graph] Web fallback | query: "${userQuery}"`);

  const webAnswer = await getWebAnswer(userQuery);

  // ── Nothing found anywhere ────────────────────────────────────────────────────
  if (!webAnswer) {
    console.log("[Graph] Web fallback returned nothing → not found response");

    const response = await llm.invoke([
      new SystemMessage(NOT_FOUND_PROMPT),
      new HumanMessage(userQuery),
    ]);

    return {
      messages: [
        new AIMessage({
          content: response.content,
          additional_kwargs: {
            metadata: null,
            source: "not_found",
          },
        }),
      ],
    };
  }

  // ── URL-only source — no scraping, return link directly ──────────────────────
  if (webAnswer.is_url_only) {
    return {
      messages: [
        new AIMessage({
          content: `For this, the best place to check is the official page: ${webAnswer.source_label}\n${webAnswer.source_url}`,
          additional_kwargs: {
            metadata: {
              type: "web_source",
              source_label: webAnswer.source_label,
              source_url: webAnswer.source_url,
              cached: webAnswer.cached,
              is_url_only: true,
              disclosure: webAnswer.disclosure || null,
            },
            source: "web_url_only",
          },
        }),
      ],
    };
  }

  // ── Scraped content — pass through LLM with web fallback prompt ───────────────
  const response = await llm.invoke([
    new SystemMessage(WEB_FALLBACK_SYSTEM_PROMPT),
    new HumanMessage(
      [
        `Source: ${webAnswer.source_label}`,
        `URL: ${webAnswer.source_url}`,
        webAnswer.disclosure ? `Disclosure: ${webAnswer.disclosure}` : "",
        ``,
        `Content:`,
        webAnswer.content,
        ``,
        `Student Question: ${userQuery}`,
      ]
        .filter(Boolean)
        .join("\n"),
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
          source: "web",
        },
      }),
    ],
  };
};

// ─── Graph Definition ─────────────────────────────────────────────────────────

const workflow = new StateGraph(GraphState)
  .addNode("local_search", callLocalData)
  .addNode("web_search", callWebSearch)
  .setEntryPoint("local_search")
  .addConditionalEdges("local_search", (state) => {
    const lastMsg = state.messages[state.messages.length - 1];
    return lastMsg.content.trim() === "NOT_FOUND_IN_DATA"
      ? "web_search"
      : "__end__";
  })
  .addEdge("web_search", "__end__");

const checkpointer = new MemorySaver();

export const campusBot = workflow.compile({ checkpointer });

// ─── Guardrail-Aware Entry Point ──────────────────────────────────────────────

/**
 * runCampusBot(userMessage, threadId)
 *
 * Single entry point for all queries.
 * Applies guardrails before the graph runs.
 *
 * @param {string} userMessage
 * @param {string} threadId
 * @returns {{ response, metadata, query_type, source }}
 */
export async function runCampusBot(userMessage, threadId = "default") {
  const guardrail = applyGuardrails(userMessage);

  if (guardrail) {
    console.log(
      `[Guardrail] Intercepted | tier: ${guardrail.tier} | id: ${guardrail.id}`,
    );
    return {
      response: guardrail.response,
      metadata: {
        guardrail: true,
        tier: guardrail.tier,
        id: guardrail.id,
        is_critical: guardrail.is_critical,
        source: "guardrail",
      },
    };
  }

  const result = await campusBot.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId } },
  );

  const lastMessage = result.messages[result.messages.length - 1];

  return {
    response: lastMessage.content,
    metadata: lastMessage.additional_kwargs?.metadata || null,
    query_type: lastMessage.additional_kwargs?.query_type || null,
    source: lastMessage.additional_kwargs?.source || null,
  };
}
