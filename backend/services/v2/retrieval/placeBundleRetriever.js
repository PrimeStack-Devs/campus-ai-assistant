import { LOCATION_INTENT_PATTERN } from "../constants/intentPatterns.js";
import {
  getCampusPlaceBundle,
  getRelevantPlaceBundleFromResults,
} from "../vectorStore.js";

export function getPlaceBundleForQuery(query) {
  const isLocationQuery = LOCATION_INTENT_PATTERN.test(query);
  const placeBundle = isLocationQuery ? getCampusPlaceBundle(query) : null;

  return {
    isLocationQuery,
    placeBundle,
  };
}

export function getPlaceBundleFromSearchResults(query, searchResults) {
  return getRelevantPlaceBundleFromResults(query, searchResults);
}
