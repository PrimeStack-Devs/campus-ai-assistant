import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { campusData, resetCampusData } from "../campusDataCache.js";
import { createStandardDocuments } from "../documents/documentFactory.js";
import { createPathDocuments } from "../documents/pathDocuments.js";
import { createScheduleDocuments } from "../documents/scheduleDocuments.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILES = [
  { name: "buildings.json", category: "Building" },
  { name: "departments.json", category: "Department" },
  { name: "facilities.json", category: "Facility" },
  { name: "faculty.json", category: "Faculty" },
  { name: "policies.json", category: "Policy" },
  { name: "paths.json", category: "Navigation", isPath: true },
  { name: "services.json", category: "Service" },
  { name: "schedules.json", category: "Schedule" },
];

const getArrayPayload = (rawData) =>
  Array.isArray(rawData) ? rawData : Object.values(rawData).find(Array.isArray) || [];

export function loadCampusDataDocuments() {
  resetCampusData();

  const allDocs = [];
  const dataDir = path.resolve(__dirname, "../../../../campus-data");

  for (const file of DATA_FILES) {
    const filePath = path.join(dataDir, file.name);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${file.name} not found. skipping...`);
      continue;
    }

    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (file.name === "buildings.json") {
      campusData.buildings = Array.isArray(rawData) ? rawData : [];
    } else if (file.name === "departments.json") {
      campusData.departments = Array.isArray(rawData) ? rawData : [];
    } else if (file.name === "services.json") {
      campusData.services = Array.isArray(rawData) ? rawData : [];
    }

    if (file.isPath) {
      campusData.paths = Array.isArray(rawData.paths) ? rawData.paths : [];
      campusData.routeSummaries = Array.isArray(rawData.route_summaries)
        ? rawData.route_summaries
        : [];

      allDocs.push(...createPathDocuments(campusData.paths, file.category));
      continue;
    }

    if (file.name === "schedules.json") {
      allDocs.push(...createScheduleDocuments(rawData, file.category));
      continue;
    }

    allDocs.push(...createStandardDocuments(getArrayPayload(rawData), file.category));
  }

  return allDocs;
}
