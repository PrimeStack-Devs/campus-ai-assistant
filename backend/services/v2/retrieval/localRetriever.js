import {
  PERSON_SCORE_THRESHOLD,
  VECTOR_SCORE_THRESHOLD,
} from "../config/thresholds.js";
import { searchCampusData } from "../vectorStore.js";

export async function searchLocalCampusData(query, queryType) {
  const searchLimit = queryType === "person" ? 8 : 4;
  const searchResults = await searchCampusData(query, searchLimit);
  const bestScore = searchResults[0]?.[1] ?? 0;
  const bestMatch = searchResults[0]?.[0];
  const threshold =
    queryType === "person" ? PERSON_SCORE_THRESHOLD : VECTOR_SCORE_THRESHOLD;
  const hasGoodVectorMatch = Boolean(bestMatch && bestScore >= threshold);

  return {
    searchResults,
    bestScore,
    bestMatch,
    threshold,
    hasGoodVectorMatch,
  };
}
