import { campusData } from "../campusDataCache.js";
import { getIntentAwareScore, scoreCandidate } from "./scoring.js";
import {
  findBuildingForQuery,
  findBuildingFromMetadata,
} from "./placeMatcher.js";
import { findRouteSummaryForBuilding } from "./routeMatcher.js";

export const getCampusPlaceBundle = (query) => {
  const building = findBuildingForQuery(query);
  if (!building) return null;

  const relatedDepartments = campusData.departments
    .filter((department) => department.building_id === building.id)
    .slice(0, 5)
    .map((department) => ({
      name: department.name,
      floor: department.floor,
      programs: department.programs || [],
    }));

  const routeSummary = findRouteSummaryForBuilding(building);

  return {
    type: "place_bundle",
    destination: {
      id: building.id,
      code: building.code,
      name: building.name,
      short_name: building.short_name,
      description: building.description,
      zone: building.zone,
      floors: building.floors,
      coordinates: {
        lat: building.lat,
        lng: building.lng,
        verified: building.coordinates_verified,
      },
      nearby: building.nearby || [],
      aliases: building.aliases || [],
    },
    route: routeSummary
      ? {
          label:
            routeSummary.label ||
            `${routeSummary.from_name} to ${routeSummary.to_name}`,
          summary:
            routeSummary.summary || routeSummary.route_description || null,
          distance_m:
            routeSummary.total_distance_m || routeSummary.distance_m || null,
          walk_minutes:
            routeSummary.total_walk_minutes || routeSummary.walk_minutes || null,
          landmarks: routeSummary.landmarks || [],
        }
      : null,
    related_departments: relatedDepartments,
  };
};

export const getRelevantPlaceBundleFromResults = (query, searchResults = []) => {
  const candidates = searchResults
    .map(([doc, similarity]) => {
      const metadata = doc?.metadata || {};
      const building = findBuildingFromMetadata(metadata);
      if (!building?.lat || !building?.lng) return null;

      return {
        building,
        metadata,
        similarity,
        queryScore: scoreCandidate(query, [
          metadata.name,
          metadata.label,
          metadata.title,
          metadata.building_name,
          building.name,
          building.short_name,
          building.code,
          ...(metadata.aliases || []),
          ...(building.aliases || []),
        ]),
        intentScore: getIntentAwareScore(query, metadata, building),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const totalA = a.queryScore + a.intentScore;
      const totalB = b.queryScore + b.intentScore;
      if (totalB !== totalA) return totalB - totalA;
      if (b.queryScore !== a.queryScore) return b.queryScore - a.queryScore;
      return b.similarity - a.similarity;
    });

  if (candidates.length === 0) return null;

  const best = candidates[0];
  const bundle = getCampusPlaceBundle(
    best.metadata.building_name || best.metadata.name || best.building.name,
  );

  if (!bundle) return null;

  return {
    ...bundle,
    matched_entity: {
      id: best.metadata.id || null,
      name: best.metadata.name || best.metadata.label || best.metadata.title || null,
      category: best.metadata.category || null,
      building_id: best.metadata.building_id || best.building.id,
      building_name: best.metadata.building_name || best.building.name,
    },
  };
};
