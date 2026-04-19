import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embeddings.js";
import { loadCampusDataDocuments } from "./loaders/campusDataLoader.js";

let vectorStore;

export const initializeStore = async () => {
  console.log("Initializing Campus Brain...");

  const allDocs = loadCampusDataDocuments();
  vectorStore = new MemoryVectorStore(embeddings);

  const batchSize = 8;

  for (let i = 0; i < allDocs.length; i += batchSize) {
    await vectorStore.addDocuments(allDocs.slice(i, i + batchSize));
  }

  console.log(`Indexed ${allDocs.length} campus documents.`);
};

export const getStore = () => vectorStore;
