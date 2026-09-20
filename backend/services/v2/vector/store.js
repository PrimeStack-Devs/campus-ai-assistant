import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embeddings.js";
import { campusData, resetCampusData } from "./campusDataCache.js";
import { FeedbackVector } from "../../../models/campusModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let vectorStore;

export const initializeStore = async () => {
  const start = Date.now();
  console.log("⚡ Initializing Campus Brain (Fast Startup)...");

  // 1. Load structured entities into cache from DB or data/seeds
  const dbDir = path.resolve(__dirname, "../../../data/db");
  const seedDir = path.resolve(__dirname, "../../../data/seeds");
  const sourceDir = fs.existsSync(dbDir) ? dbDir : seedDir;

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

  // 2. Load pre-computed vector embeddings into vector store (read-only seed data)
  const vecPath = path.resolve(
    __dirname,
    "../../../data/vectors/precomputed_vectors.json"
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

  // 3. Load dynamic feedback vectors from MongoDB (if connected)
  try {
    if (mongoose.connection.readyState === 1) {
      const feedbackDocs = await FeedbackVector.find({}).lean();
      if (feedbackDocs.length > 0) {
        const docs = feedbackDocs.map(
          (r) => new Document({ pageContent: r.pageContent, metadata: r.metadata || {} })
        );
        const vectors = feedbackDocs.map((r) => r.vector);
        await vectorStore.addVectors(vectors, docs);
        console.log(
          `✅ Loaded ${feedbackDocs.length} feedback vectors from MongoDB.`
        );
      }
    }
  } catch (mongoErr) {
    console.warn("⚠️ Could not load feedback vectors from MongoDB:", mongoErr.message);
  }
};

export const getStore = () => vectorStore;

/**
 * Dynamically add newly ingested documents and vectors at runtime.
 * Persists to MongoDB so feedback survives Vercel cold starts.
 */
export const addDynamicDocuments = async (documents, vectors, source = "dynamic") => {
  if (!vectorStore) {
    vectorStore = new MemoryVectorStore(embeddings);
  }

  // Add to in-memory vector store for immediate availability
  await vectorStore.addVectors(vectors, documents);

  // Persist to MongoDB (works on Vercel, unlike filesystem writes)
  try {
    if (mongoose.connection.readyState === 1) {
      const mongoRecords = documents.map((doc, i) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata || {},
        vector: vectors[i],
        source,
      }));
      await FeedbackVector.insertMany(mongoRecords);
      console.log(`[Store] Persisted ${documents.length} dynamic documents to MongoDB.`);
    } else {
      console.warn("[Store] MongoDB not connected — documents added to in-memory store only.");
    }
  } catch (mongoErr) {
    console.error("[Store] MongoDB persist failed:", mongoErr.message);
    // Still OK — vectors are in the in-memory store for this invocation
  }
};

/**
 * Completely clear the vector store and its persistent storage
 */
export const clearVectorStore = async () => {
  vectorStore = new MemoryVectorStore(embeddings);
  resetCampusData();

  // Clear the local precomputed_vectors.json (if writable)
  try {
    const vecPath = path.resolve(
      __dirname,
      "../../../data/vectors/precomputed_vectors.json"
    );
    fs.writeFileSync(vecPath, JSON.stringify([], null, 2), "utf-8");
    console.log("[Store] precomputed_vectors.json cleared.");
  } catch (fsErr) {
    console.warn("[Store] Could not clear precomputed_vectors.json:", fsErr.message);
  }

  // Clear feedback vectors from MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      const result = await FeedbackVector.deleteMany({});
      console.log(`[Store] Cleared ${result.deletedCount} feedback vectors from MongoDB.`);
    }
  } catch (mongoErr) {
    console.warn("[Store] Could not clear MongoDB feedback vectors:", mongoErr.message);
  }

  console.log("[Store] Vector store cleared.");
};
