import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";
import { renderHTML } from "../utils/htmlRenderer.js";
import { cosineSimilarity } from "../utils/similarity.js";
import { routeQuery, handleDynamicRoute } from "./router.js";

let embedder;
let vectorStore = [];

// ============================
// INITIALIZE STATIC RAG
// ============================

export const initializeRAG = async (documents) => {
  console.log("Splitting documents...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 200,
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
// MAIN ASK FUNCTION
// ============================

export const askQuestion = async (query) => {
  const SIMILARITY_THRESHOLD = 0.60;

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let ragAnswer = "";
  let sources = [];

  // ============================
  // 1️⃣ DYNAMIC ROUTER CHECK
  // ============================

  const { bestMatch, highestScore } = await routeQuery(query);

  if (bestMatch && highestScore > SIMILARITY_THRESHOLD) {
    const dynamicContent = await handleDynamicRoute(bestMatch.name, query);

    if (dynamicContent) {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are the official AI Campus Information Assistant for Parul University.

Answer the question using only the provided content.

Provide a clear, structured, and professional explanation.
Do not introduce external information.
If specific details are missing, state that the available information does not specify those details.
`
          },
          {
            role: "user",
            content: `Content:\n${dynamicContent}\n\nQuestion:\n${query}`,
          },
        ],
      });

      ragAnswer = response.choices[0].message.content;
      sources = [`live: ${bestMatch.name}`];
    }
  }

  // ============================
  // 2️⃣ STATIC FALLBACK
  // ============================

  if (!ragAnswer) {
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

    const scoredDocs = vectorStore.map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.vector),
    }));

    scoredDocs.sort((a, b) => b.score - a.score);

    const topDocs = scoredDocs.slice(0, 6);

    const context = topDocs.map((doc) => doc.content).join("\n\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are the official AI Campus Information Assistant for Parul University.

Answer the question strictly using the provided context.
Provide structured and professional responses.
Do not add external information.
`
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${query}`,
        },
      ],
    });

    ragAnswer = response.choices[0].message.content;

    sources = [
      ...new Set(topDocs.map((doc) => doc.metadata?.source || "unknown")),
    ];
  }

  // ============================
  // 3️⃣ FORMATTER AGENT (JSON)
  // ============================

  const formattedResponse = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a response formatting agent for Parul University.

Convert the given response into strictly valid JSON.

Schema:
{
  "title": "string",
  "summary": "string",
  "sections": [
    {
      "heading": "string",
      "content_type": "paragraph | list",
      "content": ["string"]
    }
  ]
}

Rules:
- Output only valid JSON.
- No markdown.
- No explanations.
- Organize content clearly.
`
      },
      {
        role: "user",
        content: ragAnswer,
      },
    ],
    temperature: 0.2,
  });

  let structuredJSON;

  try {
    structuredJSON = JSON.parse(
      formattedResponse.choices[0].message.content
    );
  } catch (error) {
    console.error("Formatter JSON parsing failed:", error);

    structuredJSON = {
      title: "Response",
      summary: ragAnswer,
      sections: [],
    };
  }

  // ============================
  // 4️⃣ RENDER HTML
  // ============================

  const finalHTML = renderHTML(structuredJSON);

  return {
    reply: finalHTML,
    sources,
  };
};