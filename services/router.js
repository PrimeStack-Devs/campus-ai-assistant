import fs from "fs";
import { pipeline } from "@xenova/transformers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { cosineSimilarity } from "../utils/similarity.js";
import { scrapePage } from "./scraper.js";

let embedder;
let categories = [];
const cache = {};

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// ============================
// INITIALIZE ROUTER
// ============================

export const initializeRouter = async () => {
  console.log("Initializing router...");

  const websiteData = JSON.parse(
    fs.readFileSync("./data/website.json", "utf-8")
  );

  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  categories = [];

  for (const [name, data] of Object.entries(websiteData)) {
    const output = await embedder(data.description, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(output.data ?? output[0].data ?? output[0]);

   categories.push({
  name,
  url: data.url,
  vector,
  intent_keywords: data.intent_keywords || [],
});
  }

  console.log(
    "Router initialized with categories:",
    categories.map((c) => c.name)
  );
};

// ============================
// ROUTE QUERY
// ============================

export const routeQuery = async (query) => {
  const queryOutput = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const queryVector = Array.from(
    queryOutput.data ?? queryOutput[0].data ?? queryOutput[0]
  );

  let bestMatch = null;
  let highestScore = 0;

 for (const category of categories) {
  let score = cosineSimilarity(queryVector, category.vector);

  // 🔥 Keyword Boost
  const queryLower = query.toLowerCase();

  for (const keyword of category.intent_keywords || []) {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 0.15; // boost weight
    }
  }

  if (score > highestScore) {
    highestScore = score;
    bestMatch = category;
  }
}

  console.log(
    `Routing decision → Category: ${
      bestMatch?.name || "None"
    }, Similarity: ${highestScore.toFixed(3)}`
  );

  return { bestMatch, highestScore };
};

// ============================
// DYNAMIC RETRIEVAL (RAG STYLE)
// ============================

export const handleDynamicRoute = async (categoryName, query) => {
  const now = Date.now();

  let rawContent;

  // Cache check
  if (
    cache[categoryName] &&
    now - cache[categoryName].timestamp < CACHE_EXPIRY
  ) {
    console.log("Using cached content for:", categoryName);
    rawContent = cache[categoryName].content;
  } else {
    const category = categories.find((c) => c.name === categoryName);
    if (!category) return null;

    console.log("Scraping live content for:", categoryName);
    rawContent = await scrapePage(category.url);

    cache[categoryName] = {
      content: rawContent,
      timestamp: now,
    };
  }

  // 🔥 Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
   chunkSize: 1200,
chunkOverlap: 200,
topChunks: 6
  });

  const docs = await splitter.createDocuments([rawContent]);

  // 🔥 Embed query
  const queryOutput = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const queryVector = Array.from(
    queryOutput.data ?? queryOutput[0].data ?? queryOutput[0]
  );

  // 🔥 Embed chunks + score
  const scoredDocs = [];

  for (const doc of docs) {
    const output = await embedder(doc.pageContent, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(
      output.data ?? output[0].data ?? output[0]
    );

    const score = cosineSimilarity(queryVector, vector);

    scoredDocs.push({
      content: doc.pageContent,
      score,
    });
  }

  scoredDocs.sort((a, b) => b.score - a.score);

  const topDocs = scoredDocs.slice(0, 4);

  const relevantContent = topDocs
    .map((doc) => doc.content)
    .join("\n\n");

  return relevantContent;
};