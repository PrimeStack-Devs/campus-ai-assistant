import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embeddings.js";
import { campusData, resetCampusData } from "./campusDataCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let vectorStore;

export const initializeStore = async () => {
  const start = Date.now();
  console.log("⚡ Initializing Campus Brain (Fast Startup)...");

  // 1. Load structured entities into cache from DB or campus-data
  const dbDir = path.resolve(__dirname, "../../../data/db");
  const campusDataDir = path.resolve(__dirname, "../../../campus-data");
  const sourceDir = fs.existsSync(dbDir) ? dbDir : campusDataDir;

  resetCampusData();
  const bPath = path.join(sourceDir, "buildings.json");
  if (fs.existsSync(bPath)) {
    const raw = JSON.parse(fs.readFileSync(bPath, "utf-8"));
    campusData.buildings = Array.isArray(raw) ? raw : [];
  }

  const dPath = path.join(sourceDir, "departments.json");
  if (fs.existsSync(dPath)) {
    const raw = JSON.parse(fs.readFileSync(dPath, "utf-8"));
    campusData.departments = Array.isArray(raw) ? raw : [];
  }

  const sPath = path.join(sourceDir, "services.json");
  if (fs.existsSync(sPath)) {
    const raw = JSON.parse(fs.readFileSync(sPath, "utf-8"));
    campusData.services = Array.isArray(raw) ? raw : [];
  }

  const pPath = path.join(sourceDir, "paths.json");
  if (fs.existsSync(pPath)) {
    const raw = JSON.parse(fs.readFileSync(pPath, "utf-8"));
    campusData.paths = Array.isArray(raw.paths) ? raw.paths : [];
    campusData.routeSummaries = Array.isArray(raw.route_summaries)
      ? raw.route_summaries
      : [];
  }

  // 2. Load pre-computed vector embeddings into vector store
  const vecPath = path.resolve(
    __dirname,
    "../../../data/precomputed_vectors.json"
  );
  vectorStore = new MemoryVectorStore(embeddings);

  if (fs.existsSync(vecPath)) {
    const records = JSON.parse(fs.readFileSync(vecPath, "utf-8"));
    const docs = records.map(
      (r) => new Document({ pageContent: r.pageContent, metadata: r.metadata })
    );
    const vectors = records.map((r) => r.vector);

    await vectorStore.addVectors(vectors, docs);
    console.log(
      `✅ Loaded ${records.length} pre-computed vectors in ${Date.now() - start}ms (Instant Boot).`
    );
  } else {
    console.warn(
      "⚠️ Pre-computed vectors not found. Run 'node scripts/precomputeVectors.js' to create them."
    );
  }
};

export const getStore = () => vectorStore;

/**
 * Dynamically add newly ingested documents and vectors at runtime
 */
export const addDynamicDocuments = async (documents, vectors) => {
  if (!vectorStore) {
    vectorStore = new MemoryVectorStore(embeddings);
  }

  await vectorStore.addVectors(vectors, documents);

  // Persist to precomputed_vectors.json
  const vecPath = path.resolve(
    __dirname,
    "../../../data/precomputed_vectors.json"
  );
  let existing = [];
  if (fs.existsSync(vecPath)) {
    existing = JSON.parse(fs.readFileSync(vecPath, "utf-8"));
  }

  const newRecords = documents.map((doc, i) => ({
    id: `dyn_${Date.now()}_${i}`,
    pageContent: doc.pageContent,
    metadata: doc.metadata || {},
    vector: vectors[i],
  }));

  existing.push(...newRecords);
  fs.writeFileSync(vecPath, JSON.stringify(existing, null, 2), "utf-8");
  console.log(`[Store] Added ${documents.length} dynamic documents to vector store.`);
};

/**
 * Completely clear the vector store and its persistent precomputed_vectors.json file
 */
export const clearVectorStore = async () => {
  vectorStore = new MemoryVectorStore(embeddings);
  resetCampusData();

  const vecPath = path.resolve(
    __dirname,
    "../../../data/precomputed_vectors.json"
  );
  fs.writeFileSync(vecPath, JSON.stringify([], null, 2), "utf-8");
  console.log("[Store] Vector store and precomputed_vectors.json cleared.");
};
