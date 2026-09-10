import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { embeddings } from "../services/v2/vector/embeddings.js";
import { loadCampusDataDocuments } from "../services/v2/vector/loaders/campusDataLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function precompute() {
  console.log("⚡ Starting Vector Pre-computation...");

  const allDocs = loadCampusDataDocuments();
  console.log(`Loaded ${allDocs.length} campus documents across all categories.`);

  const batchSize = 16;
  const precomputedData = [];

  for (let i = 0; i < allDocs.length; i += batchSize) {
    const batch = allDocs.slice(i, i + batchSize);
    const texts = batch.map((d) => d.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    batch.forEach((doc, idx) => {
      precomputedData.push({
        id: `chunk_${i + idx}_${doc.metadata?.id || "doc"}`,
        pageContent: doc.pageContent,
        metadata: doc.metadata || {},
        vector: vectors[idx],
      });
    });

    process.stdout.write(
      `\rProgress: ${precomputedData.length}/${allDocs.length} embedded...`
    );
  }

  const outPath = path.resolve(
    __dirname,
    "../data/vectors/precomputed_vectors.json"
  );
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(precomputedData, null, 2), "utf-8");

  console.log(`\n✅ Pre-computed vectors saved to: ${outPath} (${precomputedData.length} records)`);

  // Also setup local persistent DB directory for dynamic uploads
  const dbDir = path.resolve(__dirname, "../data/db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const seedDataDir = path.resolve(__dirname, "../data/seeds");
  const files = [
    "buildings.json",
    "departments.json",
    "facilities.json",
    "faculty.json",
    "policies.json",
    "paths.json",
    "services.json",
    "schedules.json",
  ];

  files.forEach((file) => {
    const src = path.join(seedDataDir, file);
    const dest = path.join(dbDir, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  });

  console.log("✅ Initialized persistent data store in backend/data/db/");
}

precompute().catch((err) => {
  console.error("Precompute error:", err);
  process.exit(1);
});
