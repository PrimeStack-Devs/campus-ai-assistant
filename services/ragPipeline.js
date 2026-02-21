import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";

import { cosineSimilarity } from "../utils/similarity.js";
import { routeQuery, handleDynamicRoute } from "./router.js";

let embedder;
let vectorStore = []; // In-memory vector store

// ============================
// INITIALIZE STATIC RAG
// ============================

export const initializeRAG = async (documents) => {
  console.log("Splitting documents...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(documents);

  console.log("Loading local embedding model...");

  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  console.log("Generating embeddings for static documents...");

  vectorStore = [];

  for (const doc of splitDocs) {
    const output = await embedder(doc.pageContent, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(
      output.data ?? output[0].data ?? output[0]
    );

    vectorStore.push({
      content: doc.pageContent,
      metadata: doc.metadata,
      vector,
    });
  }

  console.log("Static vector store ready.");
};

// ============================
// ASK QUESTION
// ============================

export const askQuestion = async (query) => {
 const SIMILARITY_THRESHOLD = 0.60;

  // ============================
  // 1️⃣ ROUTER CHECK (DYNAMIC)
  // ============================

  const { bestMatch, highestScore } = await routeQuery(query);
console.log("rag",bestMatch,"......\n",highestScore)
  if (bestMatch && highestScore > SIMILARITY_THRESHOLD) {
    const dynamicContent = await handleDynamicRoute(bestMatch.name, query);

    if (dynamicContent) {
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
  role: "system",
  content: `
You are the official AI Campus Information Assistant for Parul University.

Answer the user's question using only the provided content.

Response Rules:
- Provide detailed and structured explanations.
- Organize the answer using headings or bullet points where appropriate.
- Summarize all relevant information clearly.
- Maintain a professional, institutional tone.
- Do not introduce external information.
- If specific details are not available in the content, clearly state that the available information does not specify those details.

Your goal is to provide comprehensive and well-presented information suitable for students, parents, and academic evaluators.
`
},
          {
            role: "user",
            content: `Content:\n${dynamicContent}\n\nQuestion:\n${query}`,
          },
        ],
      });
console.log("response", response.choices[0].message.content);
console.log("bestMatch", bestMatch.name);
      return {
        reply: response.choices[0].message.content,
        sources: [`live: ${bestMatch.name}`],
      };
    }
  }

  // ============================
  // 2️⃣ STATIC RAG FALLBACK
  // ============================

  if (!embedder || vectorStore.length === 0) {
    throw new Error("Static vector store not initialized.");
  }

  const queryOutput = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const queryVector = Array.from(
    queryOutput.data ?? queryOutput[0].data ?? queryOutput[0]
  );

  // Compute similarity against all static docs
  const scoredDocs = vectorStore.map((doc) => ({
    ...doc,
    score: cosineSimilarity(queryVector, doc.vector),
  }));

  // Sort by highest similarity
  scoredDocs.sort((a, b) => b.score - a.score);

  const topDocs = scoredDocs.slice(0, 4);

  const context = topDocs.map((doc) => doc.content).join("\n\n");

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "Answer using ONLY the provided context. If not found, say you do not know.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${query}`,
      },
    ],
  });

  const sources = [
    ...new Set(topDocs.map((doc) => doc.metadata?.source || "unknown")),
  ];

  return {
    reply: response.choices[0].message.content,
    sources,
  };
};