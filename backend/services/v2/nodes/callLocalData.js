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
import {
  getPlaceBundleForQuery,
  getPlaceBundleFromSearchResults,
} from "../retrieval/placeBundleRetriever.js";
import { detectQueryType } from "../../../utils/guardrails.js";

export const callLocalData = async (state) => {
  const lastUserMsg = state.messages[state.messages.length - 1].content;
  const queryType = detectQueryType(lastUserMsg);
  const systemPrompt = buildSystemPrompt(queryType);

  console.log(
    `[Graph] Local search | query: "${lastUserMsg}" | type: ${queryType}`,
  );

  const { isLocationQuery, placeBundle } = getPlaceBundleForQuery(lastUserMsg);

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
  } = await searchLocalCampusData(lastUserMsg, queryType);

  console.log(
    `[Graph] Vector search | results: ${searchResults.length} | best score: ${bestScore.toFixed(3)} | threshold: ${threshold} | match: ${hasGoodVectorMatch}`,
  );

  if (!placeBundle && !hasGoodVectorMatch) {
    console.log("[Graph] No confident local match - routing to web search");
    return { messages: [new AIMessage(NOT_FOUND_IN_DATA)] };
  }

  const resultBundle = getPlaceBundleFromSearchResults(
    lastUserMsg,
    searchResults,
  );

  const context = formatCampusContext(searchResults);
  const bundleContext = formatPlaceBundle(placeBundle);

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

  if (response.content.trim() === NOT_FOUND_IN_DATA) {
    console.log("[Graph] LLM signalled NOT_FOUND - routing to web search");
    return { messages: [new AIMessage(NOT_FOUND_IN_DATA)] };
  }

  const responseMetadata =
    placeBundle || resultBundle || bestMatch?.metadata || null;

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
