import { ChatGroq } from "@langchain/groq";
import "./env.js";

export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL,
  temperature: 0.1,
});
