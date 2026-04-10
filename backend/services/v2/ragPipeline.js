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

// ─── Thresholds ───────────────────────────────────────────────────────────────

/**
 * VECTOR_SCORE_THRESHOLD
 * Minimum semantic match score to trust a local vector result.
 * Empirically, relevant local matches often land around 0.40-0.60.
 */
const VECTOR_SCORE_THRESHOLD = 0.4;

/**
 * PERSON_SCORE_THRESHOLD
 * Lower threshold for person/faculty queries.
 *
 * Why lower? Because all-MiniLM-L6-v2 doesn't strongly connect:
 *   "HOD of MCA"  →  "Head of Department for Master of Computer Application"
 *   "president of PU"  →  "Vice Chancellor / Managing Trustee"
 *
 * A lower threshold ensures we reach the local faculty.json data
 * instead of incorrectly falling through to web search.
 *
 * Tune this down if person queries still miss. Tune up if you get
 * irrelevant faculty results for non-person queries.
 */
const PERSON_SCORE_THRESHOLD = 0.3;

/**
 * LOCATION_INTENT_PATTERN
 * Guards getCampusPlaceBundle() — only fires on real location queries.
 * Without this guard, keyword scoring returns a building for almost any
 * query (e.g. "placement stats" → Placement Cell → C2) and suppresses
 * the web fallback unnecessarily.
 */
const LOCATION_INTENT_PATTERN =
  /\b(where (is|are|can i find|do i go)|location (of|for)|find|how to (reach|get to|find)|directions? (to|for)|route (to|from)|nearest|which (block|building|floor)|take me to)\b/i;

const FOLLOW_UP_REFERENCE_PATTERN =
  /\b(he|she|they|them|their|his|her|it|its|this|that|these|those|there|here|same)\b/i;
const FOLLOW_UP_START_PATTERN =
  /^(and|also|what about|how about|which|what|where|when|who|tell me|his|her|their)\b/i;
const SUBJECT_QUERY_PATTERN = /\b(subject|subjects|teach|teaches|teaching)\b/i;
const CONTACT_QUERY_PATTERN = /\b(contact|email|mail|phone|number)\b/i;
const LOCATION_QUERY_PATTERN =
  /\b(where|room|office|floor|building|location|cabin|sit)\b/i;

const replaceScalarState = (left, right) => right ?? left ?? null;

function normalizeQueryText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMessageType(message) {
  return message?._getType?.() || message?.getType?.() || message?.type || null;
}

function findPreviousMessageOfType(messages, type, beforeIndex) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    if (getMessageType(messages[index]) === type) {
      return messages[index];
    }
  }

  return null;
}

function summarizeMetadataForFollowUp(metadata) {
  if (!metadata) return null;

  const matchedEntity = metadata.matched_entity || null;
  const destination = metadata.destination || null;
  const entityName =
    matchedEntity?.name ||
    metadata.name ||
    metadata.label ||
    metadata.title ||
    destination?.name ||
    null;

  const tokens = [
    entityName,
    metadata.designation,
    metadata.department_name,
    matchedEntity?.category,
    matchedEntity?.building_name,
    metadata.building_name,
    destination?.name,
    destination?.code,
    metadata.room,
  ].filter(Boolean);

  return {
    entityName,
    context: tokens.join(" "),
  };
}

function looksLikeContextualFollowUp(query) {
  const normalizedQuery = normalizeQueryText(query);
  if (!normalizedQuery) return false;

  const words = normalizedQuery.split(" ").filter(Boolean);

  return (
    FOLLOW_UP_REFERENCE_PATTERN.test(normalizedQuery) ||
    FOLLOW_UP_START_PATTERN.test(normalizedQuery) ||
    words.length <= 5
  );
}

function buildContextualRetrievalQuery(state, rawUserMsg) {
  const currentIndex = state.messages.length - 1;
  const previousUserMessage = findPreviousMessageOfType(
    state.messages,
    "human",
    currentIndex,
  );
  const previousAIMessage = findPreviousMessageOfType(
    state.messages,
    "ai",
    currentIndex,
  );

  if (!previousUserMessage || !looksLikeContextualFollowUp(rawUserMsg)) {
    return rawUserMsg;
  }

  const previousMetadata = previousAIMessage?.additional_kwargs?.metadata || null;
  const metadataSummary = summarizeMetadataForFollowUp(previousMetadata);
  const previousQuestion = previousUserMessage.content;
  const entityName = metadataSummary?.entityName || "";
  const context = metadataSummary?.context || "";
  const normalizedQuery = normalizeQueryText(rawUserMsg);

  if (SUBJECT_QUERY_PATTERN.test(normalizedQuery)) {
    return [
      entityName,
      context,
      previousQuestion,
      "subjects taught",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (CONTACT_QUERY_PATTERN.test(normalizedQuery)) {
    return [
      entityName,
      context,
      previousQuestion,
      "contact email phone",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (LOCATION_QUERY_PATTERN.test(normalizedQuery)) {
    return [
      entityName,
      context,
      previousQuestion,
      "office room floor building location",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [rawUserMsg, entityName, context, previousQuestion]
    .filter(Boolean)
    .join(" ");
}

// ─── Format Templates ─────────────────────────────────────────────────────────

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

function buildWebFallbackPrompt(webAnswer, userQuery) {
  const queryLower = userQuery.toLowerCase();
  const isStudentAchievementsSource =
    webAnswer.source_id === "src_student_achievements";

  const genericListInstruction = `

ADDITIONAL RESPONSE RULES FOR LIST-HEAVY PAGES
- If the content is a long list, do not copy the full list into the answer.
- Summarise the main pattern first, then include only 3-6 representative examples.
- Prefer grouping examples by type when the student asked a broad question.
- Do not add filler lines such as "These are just a few..." or congratulatory intros.
- Do not add caution notes for official sources unless explicitly instructed.
`.trim();

  if (isStudentAchievementsSource) {
    return `${WEB_FALLBACK_SYSTEM_PROMPT}

SOURCE-SPECIFIC INSTRUCTION: STUDENT ACHIEVEMENTS
- The student is asking about Parul University student achievements.
- Give a short summary first covering the kinds of achievements visible on the page.
- Group the highlights into simple themes like placements, competitions, internships, research, entrepreneurship, robotics, public speaking, or cultural achievements when relevant.
- Mention only 4-6 representative highlights unless the student explicitly asks for the full list.
- If the student asks for "latest" or "recent" achievements, prioritise the most recent dated items visible in the provided content.
- Keep the answer natural, warm, and easy to read in 1 short paragraph or a very short bullet list.

${genericListInstruction}`;
  }

  const looksLikeBroadAchievementsQuery =
    queryLower.includes("achievement") &&
    !/\b(latest|recent|specific|all)\b/i.test(userQuery);

  if (looksLikeBroadAchievementsQuery) {
    return `${WEB_FALLBACK_SYSTEM_PROMPT}

${genericListInstruction}`;
  }

  return WEB_FALLBACK_SYSTEM_PROMPT;
}

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  resolvedQuery: Annotation({
    reducer: replaceScalarState,
    default: () => null,
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
  const resolvedQuery = buildContextualRetrievalQuery(state, lastUserMsg);
  const queryType = detectQueryType(resolvedQuery);
  const systemPrompt = buildSystemPrompt(queryType);

  const logSuffix =
    resolvedQuery !== lastUserMsg
      ? ` | resolved: "${resolvedQuery}"`
      : "";

  console.log(
    `[Graph] Local search | query: "${lastUserMsg}"${logSuffix} | type: ${queryType}`,
  );

  // ── Routing Decision 1: Place Bundle ────────────────────────────────────────
  // Only call getCampusPlaceBundle() for real location queries.
  const isLocationQuery = LOCATION_INTENT_PATTERN.test(resolvedQuery);
  const placeBundle = isLocationQuery
    ? getCampusPlaceBundle(resolvedQuery)
    : null;

  if (placeBundle) {
    console.log(
      `[Graph] Place bundle matched: ${placeBundle.destination.name}`,
    );
  } else if (!isLocationQuery) {
    console.log(`[Graph] Skipping place bundle — not a location query`);
  }

  //  Semantic Vector Search 
  // Person queries get more results because the exact faculty entry
  // may be ranked lower due to embedding distance between abbreviated
  // terms ("HOD", "MCA") and their full forms in the data.
  const searchLimit = queryType === "person" ? 8 : 4;
  const searchResults = await searchCampusData(resolvedQuery, searchLimit);
  const bestScore = searchResults[0]?.[1] ?? 0;
  const bestMatch = searchResults[0]?.[0];

  //  Routing Decision 2: Type-aware threshold 
  // Person queries use a lower threshold because semantic distance between
  // query terms ("HOD of MCA") and document text ("Head of Department for
  // Master of Computer Application") is larger than for other query types.
  const threshold =
    queryType === "person" ? PERSON_SCORE_THRESHOLD : VECTOR_SCORE_THRESHOLD;

  const hasGoodVectorMatch = bestMatch && bestScore >= threshold;

  console.log(
    `[Graph] Vector search | results: ${searchResults.length} | best score: ${bestScore.toFixed(3)} | threshold: ${threshold} | match: ${hasGoodVectorMatch}`,
  );

  //  Route: No local data → Web search 
  if (!placeBundle && !hasGoodVectorMatch) {
    console.log(`[Graph] No confident local match → routing to web search`);
    return {
      resolvedQuery,
      messages: [new AIMessage("NOT_FOUND_IN_DATA")],
    };
  }

  //  Build Context for LLM 
  const resultBundle = getRelevantPlaceBundleFromResults(
    resolvedQuery,
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

  //  LLM Call 
  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.slice(-3),
    new HumanMessage(
      [
        resolvedQuery !== lastUserMsg
          ? `Resolved Retrieval Query: ${resolvedQuery}`
          : "",
        `Campus Data:\n${context}`,
        bundleContext ? `Place Bundle:\n${bundleContext}` : "",
        `Student Question: ${lastUserMsg}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  ]);

  //  NOT_FOUND_IN_DATA guard 
  // Must be exact trim match. System prompt instructs no wrapping,
  // but we guard here too in case the LLM adds stray punctuation.
  if (response.content.trim() === "NOT_FOUND_IN_DATA") {
    console.log("[Graph] LLM signalled NOT_FOUND → routing to web search");
    return {
      resolvedQuery,
      messages: [new AIMessage("NOT_FOUND_IN_DATA")],
    };
  }

  const responseMetadata =
    placeBundle || resultBundle || bestMatch?.metadata || null;

  return {
    resolvedQuery,
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

//  Node 2: Web Search Fallback 

const callWebSearch = async (state) => {
  // Original user query is at length - 2
  // (length - 1 is the NOT_FOUND_IN_DATA signal message)
  const userQuery = state.messages[state.messages.length - 2].content;
  const resolvedQuery = state.resolvedQuery || userQuery;

  const logSuffix =
    resolvedQuery !== userQuery ? ` | resolved: "${resolvedQuery}"` : "";
  console.log(`[Graph] Web fallback | query: "${userQuery}"${logSuffix}`);

  const webAnswer = await getWebAnswer(resolvedQuery);

  //  Nothing found anywhere 
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

  //  URL-only source 
  if (webAnswer.is_url_only) {
    return {
      messages: [
        new AIMessage({
          content: `For this, the best place to check is the official page: ${webAnswer.source_label}\n${webAnswer.source_url}`,
          additional_kwargs: {
            metadata: {
              type: "web_source",
              source_id: webAnswer.source_id || null,
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

  //  Scraped content → LLM 
  const webSystemPrompt = buildWebFallbackPrompt(webAnswer, userQuery);
  const response = await llm.invoke([
    new SystemMessage(webSystemPrompt),
    new HumanMessage(
      [
        webAnswer.source_id ? `Source ID: ${webAnswer.source_id}` : "",
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
            source_id: webAnswer.source_id || null,
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

// Graph Definition 

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

// Guardrail-Aware Entry Point

/**
 * runCampusBot(userMessage, threadId)
 *
 * Single entry point for all queries.
 * Always call this — never call campusBot.invoke() directly.
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
