import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";
import { renderHTML } from "../utils/htmlRenderer.js";
import { cosineSimilarity } from "../utils/similarity.js";
import { routeQuery, handleDynamicRoute } from "./router.js";
import { findProfessorMatches } from "./structuredService.js";

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
      output.data ?? output[0]?.data ?? output[0]
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
  // 1️⃣ STRUCTURED PROFESSOR LOOKUP (DETERMINISTIC)
  // ============================

 const professorMatches = await findProfessorMatches(query);

  let structuredJSON = null;

  if (professorMatches) {
    structuredJSON = {
      title: "Faculty Contact Information",
      summary: "Official contact details of Parul University faculty members.",
      sections: professorMatches.map((prof) => ({
        heading: prof.name,
        content_type: "list",
        content: [
          `Role: ${prof.role || "Not specified"}`,
          `Phone: ${prof.phone || "Not available"}`,
          `Email: ${prof.email || "Not available"}`
        ]
      }))
    };

    sources = ["internal: professor_database"];
  }

  // ============================
  // 2️⃣ DYNAMIC ROUTER CHECK
  // ============================

  if (!structuredJSON) {
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

Answer strictly using provided content.
Provide structured professional response.
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
  }

  // ============================
  // 3️⃣ STATIC RAG FALLBACK
  // ============================

  if (!structuredJSON && !ragAnswer) {
    if (!embedder || vectorStore.length === 0) {
      throw new Error("Static vector store not initialized.");
    }

    const queryOutput = await embedder(query, {
      pooling: "mean",
      normalize: true,
    });

    const queryVector = Array.from(
      queryOutput.data ?? queryOutput[0]?.data ?? queryOutput[0]
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
You are the official AI Campus Information Assistant.

Answer strictly using provided context.
Provide structured response.
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
  // 4️⃣ FORMAT ONLY RAG CONTENT (NOT STRUCTURED DATA)
  // ============================

  if (!structuredJSON && ragAnswer) {
    const formattedResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
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

Return only JSON.
`
        },
        {
          role: "user",
          content: ragAnswer,
        },
      ],
      temperature: 0.2,
    });

    try {
      structuredJSON = JSON.parse(
        formattedResponse.choices[0].message.content
      );
    } catch (error) {
      structuredJSON = {
        title: "Response",
        summary: ragAnswer,
        sections: [],
      };
    }
  }

  // ============================
  // 5️⃣ RENDER HTML
  // ============================

  // const finalHTML = renderHTML(structuredJSON);

  return {
    reply: structuredJSON,
    sources,
  };
};