import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { llm } from "../config/llm.js";
import { NOT_FOUND_IN_DATA } from "../constants/graphSignals.js";
import { formatCampusContext } from "../formatters/campusContextFormatter.js";
import { formatPlaceBundle } from "../formatters/placeBundleFormatter.js";
import { buildSystemPrompt } from "../prompts/buildSystemPrompt.js";
import { searchLocalCampusData } from "../retrieval/localRetriever.js";
import { contextualizeQuery } from "../retrieval/contextualizer.js";
import {
  getPlaceBundleForQuery,
  getPlaceBundleFromSearchResults,
} from "../retrieval/placeBundleRetriever.js";
import { detectQueryType } from "../../../utils/guardrails.js";

export const callLocalData = async (state) => {
  const lastUserMsg = state.messages[state.messages.length - 1].content;

  // Contextualize follow-up questions using prior conversation history
  const effectiveQuery = await contextualizeQuery(state.messages);
  const queryType = detectQueryType(effectiveQuery);
  const systemPrompt = buildSystemPrompt(queryType);

  console.log(
    `[Graph] Local search | raw: "${lastUserMsg}" | effective: "${effectiveQuery}" | type: ${queryType}`,
  );

  const { isLocationQuery, placeBundle } = getPlaceBundleForQuery(effectiveQuery);

  if (placeBundle) {
    console.log(
      `[Graph] Place bundle matched: ${placeBundle.destination.name}`,
    );
  } else if (!isLocationQuery) {
    console.log("[Graph] Skipping place bundle - not a location query");
  }

  const {
    searchResults,
    bestScore,
    bestMatch,
    threshold,
    hasGoodVectorMatch,
  } = await searchLocalCampusData(effectiveQuery, queryType);

  console.log(
    `[Graph] Vector search | results: ${searchResults.length} | best score: ${bestScore.toFixed(3)} | threshold: ${threshold} | match: ${hasGoodVectorMatch}`,
  ); 

  // Smart check: Only abort if NO confident match AND NO prior conversation history
  // (If there is prior history, the answer could already exist in the conversation context!)
  const hasConversationHistory = state.messages.length > 2;
  if (!placeBundle && !hasGoodVectorMatch && !hasConversationHistory) {
    console.log("[Graph] No confident local match and no prior history - routing to web search");
    return { messages: [new AIMessage(NOT_FOUND_IN_DATA)] };
  }

  const resultBundle = getPlaceBundleFromSearchResults(
    effectiveQuery,
    searchResults,
  );

  const context = formatCampusContext(searchResults);
  const bundleContext = formatPlaceBundle(placeBundle);

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.slice(-5, -1),
    new HumanMessage(
      [
        context ? `Campus Data:\n${context}` : "",
        bundleContext ? `Place Bundle:\n${bundleContext}` : "",
        `Student Question: ${lastUserMsg}`,
        effectiveQuery !== lastUserMsg
          ? `(Resolved Context: ${effectiveQuery})`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  ]);

  const trimmedContent = response.content.trim();
  const isNotFound =
    trimmedContent === NOT_FOUND_IN_DATA ||
    trimmedContent.includes(NOT_FOUND_IN_DATA) ||
    /(i[’']?m\s+sorry|i\s+am\s+sorry|i\s+don[’']?t\s+have|i\s+do\s+not\s+have|i\s+couldn[’']?t\s+find|unfortunately|not\s+(found|mentioned)\s+in\s+the\s+(provided|campus|available)|no\s+information.*(found|available|provided|mentioned)|no\s+.*(found|mentioned)\s+in\s+the\s+(provided|campus|available))/i.test(
      trimmedContent
    );

  if (isNotFound) {
    console.log("[Graph] LLM signalled NOT_FOUND - routing to web search");
    return { messages: [new AIMessage(NOT_FOUND_IN_DATA)] };
  }

  const responseMetadata =
    placeBundle || (isLocationQuery ? resultBundle : null) || bestMatch?.metadata || null;

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
