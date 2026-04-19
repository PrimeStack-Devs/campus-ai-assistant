import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

export const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});
