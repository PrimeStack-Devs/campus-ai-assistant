import { getStore } from "../store.js";

export const searchCampusData = async (query, limit = 2) => {
  const vectorStore = getStore();
  if (!vectorStore) throw new Error("Vector Store not initialized!");

  return await vectorStore.similaritySearchWithScore(query, limit);
};
