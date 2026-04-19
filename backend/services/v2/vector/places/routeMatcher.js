import { campusData } from "../campusDataCache.js";
import { includesNormalized, normalizeText } from "../utils/text.js";

export function findRouteSummaryForBuilding(building) {
  return (
    campusData.routeSummaries.find(
      (route) =>
        includesNormalized(route.label, building.name) ||
        includesNormalized(route.label, building.code) ||
        includesNormalized(route.summary, building.name) ||
        includesNormalized(route.summary, building.code),
    ) ||
    campusData.paths.find(
      (route) =>
        route.to === building.id &&
        normalizeText(route.from_name).includes("main gate"),
    ) ||
    null
  );
}
