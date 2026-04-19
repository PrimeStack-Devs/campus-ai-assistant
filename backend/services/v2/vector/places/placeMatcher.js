import { campusData } from "../campusDataCache.js";
import { includesNormalized } from "../utils/text.js";
import { scoreCandidate } from "./scoring.js";

export const findBuildingForQuery = (query) => {
  const buildingCandidates = campusData.buildings.map((building) => ({
    building,
    score: scoreCandidate(query, [
      building.name,
      building.short_name,
      building.code,
      ...(building.aliases || []),
    ]),
  }));

  const departmentCandidates = campusData.departments.map((department) => ({
    building: campusData.buildings.find(
      (building) => building.id === department.building_id,
    ),
    score: scoreCandidate(query, [
      department.name,
      department.short_name,
      department.building_name,
      ...(department.aliases || []),
    ]),
  }));

  const serviceCandidates = campusData.services.map((service) => ({
    building: campusData.buildings.find(
      (building) => building.id === service.building_id,
    ),
    score: scoreCandidate(query, [
      service.name,
      service.type,
      service.building_name,
      ...(service.aliases || []),
    ]),
  }));

  return [...buildingCandidates, ...departmentCandidates, ...serviceCandidates]
    .filter((candidate) => candidate.building && candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.building;
};

export const findBuildingFromMetadata = (metadata = {}) =>
  campusData.buildings.find((building) => building.id === metadata.id) ||
  campusData.buildings.find((building) => building.code === metadata.code) ||
  campusData.buildings.find((building) => building.id === metadata.building_id) ||
  campusData.buildings.find(
    (building) => building.name === metadata.building_name,
  ) ||
  campusData.buildings.find(
    (building) =>
      metadata.building_name &&
      includesNormalized(building.name, metadata.building_name),
  ) ||
  campusData.buildings.find(
    (building) => metadata.name && includesNormalized(building.name, metadata.name),
  ) ||
  null;
