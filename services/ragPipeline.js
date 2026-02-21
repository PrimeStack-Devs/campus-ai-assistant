import Groq from "groq-sdk";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { pipeline } from "@xenova/transformers";

export let vectorStore;
let embedder;

class LocalEmbeddings {
  async embedDocuments(texts) {
    const vectors = [];

    for (const text of texts) {
      const output = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });

      const vector = Array.from(output.data ?? output[0].data ?? output[0]);
      vectors.push(vector);
    }

    return vectors;
  }

  async embedQuery(text) {
    const output = await embedder(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data ?? output[0].data ?? output[0]);
  }
}

export const initializeRAG = async (allDocs) => {
  console.log("Splitting documents...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(allDocs);

  console.log("Loading local embedding model...");
  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  const embeddings = new LocalEmbeddings();

  console.log("Creating in-memory vector store...");

  vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  console.log("Vector store created");
};

export const askQuestion = async (query) => {
  if (!vectorStore) {
    throw new Error("Vector store not initialized");
  }

  const retriever = vectorStore.asRetriever({ k: 3 });
  const relevantDocs = await retriever.getRelevantDocuments(query);

  const context = relevantDocs.map(doc => doc.pageContent).join("\n");

  // 🔥 Collect unique sources
  const sources = [
    ...new Set(relevantDocs.map(doc => doc.metadata?.source || "unknown"))
  ];

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are an official campus assistant. Answer only using provided context. If information is missing, say you do not know.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${query}`,
      },
    ],
  });

  return {
    answer: response.choices[0].message.content,
    sources,
  };
};