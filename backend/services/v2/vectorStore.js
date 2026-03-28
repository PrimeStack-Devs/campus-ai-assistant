import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let vectorStore;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const campusData = {
  buildings: [],
  departments: [],
  services: [],
  paths: [],
  routeSummaries: [],
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${formatValue(nestedValue)}`)
      .filter((entry) => !entry.endsWith(": "))
      .join(" | ");
  }
  return String(value);
};

// 1. Initialize Local Embeddings (Runs on your server's CPU/RAM)
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2", // Efficient, high-quality model
});

/**
 * Initializes the vector store by loading and indexing all 8-9 JSON files.
 */
export const initializeStore = async () => {
  console.log("🧠 Initializing Campus Brain...");
  const allDocs = [];
  const dataDir = path.resolve(__dirname, "../../campus-data");

  const files = [
    { name: "buildings.json", category: "Building" },
    { name: "departments.json", category: "Department" },
    { name: "facilities.json", category: "Facility" },
    { name: "faculty.json", category: "Faculty" },
    { name: "policies.json", category: "Policy" },
    { name: "paths.json", category: "Navigation", isPath: true },
    { name: "services.json", category: "Service" },
    { name: "schedules.json", category: "Schedule" },
  ];

  for (const file of files) {
    const filePath = path.join(dataDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: ${file.name} not found. skipping...`);
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

    // A. Special Handling for path.json (Navigation)
    if (file.isPath) {
      campusData.paths = Array.isArray(rawData.paths) ? rawData.paths : [];
      campusData.routeSummaries = Array.isArray(rawData.route_summaries)
        ? rawData.route_summaries
        : [];

      rawData.paths.forEach((p) => {
        const content = `Route from ${p.from_name} to ${p.to_name}. Distance: ${p.distance_m}m. Time: ${p.walk_minutes} min. Directions: ${p.route_description}. Landmarks: ${p.landmarks.join(", ")}`;
        allDocs.push(
          new Document({
            pageContent: content,
            metadata: { ...p, category: file.category },
          }),
        );
      });
      continue;
    }

    // B. Standard handling for other JSON Arrays
    const items = Array.isArray(rawData)
      ? rawData
      : Object.values(rawData).find(Array.isArray) || [];

    items.forEach((item) => {
      const searchableFields = [
        `Category: ${file.category}`,
        `Id: ${formatValue(item.id)}`,
        `Name: ${formatValue(item.name || item.label || item.title || item.route_name)}`,
        `Code: ${formatValue(item.code || item.short_name || item.route_number)}`,
        `Type: ${formatValue(item.type || item.designation || item.role)}`,
        `Department: ${formatValue(item.department_name || item.department_id)}`,
        `Location: ${formatValue(item.building_name)} ${item.floor !== undefined ? `Floor ${item.floor}` : ""}`.trim(),
        `Room: ${formatValue(item.room)}`,
        `Contact: ${formatValue(item.contact_phone || item.phone)} ${formatValue(item.contact_email || item.email)}`.trim(),
        `Description: ${formatValue(item.description || item.content || item.notes)}`,
        `Aliases: ${formatValue(item.aliases)}`,
        `Keywords: ${formatValue(item.tags)}`,
        `Programs: ${formatValue(item.programs)}`,
        `Subjects: ${formatValue(item.subjects || item.subjects_taught)}`,
        `Institutes: ${formatValue(item.institutes)}`,
        `Nearby: ${formatValue(item.nearby)}`,
        `Facilities: ${formatValue(item.facilities)}`,
        `Rules: ${formatValue(item.rules)}`,
        `Timings: ${formatValue(item.timings)}`,
        `Frequency: ${formatValue(item.frequency)}`,
        `Stops: ${formatValue(item.stops)}`,
        `Return Schedule: ${formatValue(item.return_schedule)}`,
        `HOD: ${formatValue(item.hod)}`,
      ].filter((line) => !line.endsWith(": "));

      const content = searchableFields.join("\n");

      allDocs.push(
        new Document({
          pageContent: content,
          metadata: { ...item, category: file.category }, // Store original object in metadata
        }),
      );
    });
  }

  // 2. Create the Memory Vector Store
  // Add documents in small batches so local embeddings do not try to process
  // the full campus dataset in one large allocation.
  vectorStore = new MemoryVectorStore(embeddings);
  const batchSize = 8;

  for (let i = 0; i < allDocs.length; i += batchSize) {
    await vectorStore.addDocuments(allDocs.slice(i, i + batchSize));
  }
  console.log(`✅ Indexed ${allDocs.length} campus documents.`);
};

/**
 * Perform semantic search
 */
export const searchCampusData = async (query, limit = 2) => {
  if (!vectorStore) throw new Error("Vector Store not initialized!");

  // Returns [Document, score]. Lower score = Higher similarity.
  return await vectorStore.similaritySearchWithScore(query, limit);
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesNormalized = (left, right) => {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

const HEALTH_KEYWORDS = [
  "fever",
  "sick",
  "ill",
  "pain",
  "vomit",
  "vomiting",
  "headache",
  "injury",
  "bleeding",
  "doctor",
  "hospital",
  "medical",
  "medicine",
  "emergency",
  "first aid",
  "ambulance",
  "pharmacy",
  "health",
];

const FOOD_KEYWORDS = [
  "canteen",
  "food",
  "food court",
  "mess",
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "tea",
  "coffee",
  "eat",
];

const HOSTEL_KEYWORDS = [
  "hostel",
  "warden",
  "room",
  "allotment",
  "rector",
  "superintendent",
];

const queryHasAny = (query, keywords) => {
  const normalizedQuery = normalizeText(query);
  return keywords.some((keyword) => normalizedQuery.includes(normalizeText(keyword)));
};

const getIntentAwareScore = (query, metadata = {}, building = {}) => {
  const values = [
    metadata.type,
    metadata.category,
    metadata.name,
    metadata.label,
    metadata.title,
    metadata.notes,
    metadata.description,
    building.category,
    building.name,
    building.description,
    ...(metadata.aliases || []),
    ...(building.aliases || []),
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value));

  let score = 0;

  if (queryHasAny(query, HEALTH_KEYWORDS)) {
    if (values.some((value) => /hospital|medical|doctor|emergency|first aid|pharmacy|health/.test(value))) {
      score += 10;
    }
    if (values.some((value) => /mess|canteen|food court|restaurant|temple/.test(value))) {
      score -= 6;
    }
  }

  if (queryHasAny(query, FOOD_KEYWORDS)) {
    if (values.some((value) => /mess|canteen|food court|restaurant|dining|snacks|tea|coffee/.test(value))) {
      score += 10;
    }
    if (values.some((value) => /temple|hospital/.test(value))) {
      score -= 5;
    }
  }

  if (queryHasAny(query, HOSTEL_KEYWORDS)) {
    if (values.some((value) => /hostel|warden|rector|superintendent/.test(value))) {
      score += 4;
    }
  }

  return score;
};

const scoreCandidate = (query, values) => {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  for (const value of values.filter(Boolean)) {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) continue;

    if (normalizedValue === normalizedQuery) score += 10;
    else if (normalizedQuery.includes(normalizedValue)) score += 6;
    else if (normalizedValue.includes(normalizedQuery)) score += 5;
    else {
      const queryTokens = new Set(normalizedQuery.split(" "));
      const overlap = normalizedValue
        .split(" ")
        .filter((token) => queryTokens.has(token)).length;
      score += overlap;
    }
  }

  return score;
};

const findBuildingForQuery = (query) => {
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

const findBuildingFromMetadata = (metadata = {}) =>
  campusData.buildings.find((building) => building.id === metadata.id) ||
  campusData.buildings.find((building) => building.code === metadata.code) ||
  campusData.buildings.find((building) => building.id === metadata.building_id) ||
  campusData.buildings.find((building) => building.name === metadata.building_name) ||
  campusData.buildings.find(
    (building) =>
      metadata.building_name &&
      includesNormalized(building.name, metadata.building_name),
  ) ||
  campusData.buildings.find(
    (building) => metadata.name && includesNormalized(building.name, metadata.name),
  ) ||
  null;

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

  const routeSummary =
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
    null;

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
  const bundle = getCampusPlaceBundle(best.metadata.building_name || best.metadata.name || best.building.name);
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

export const getStore = () => vectorStore;
