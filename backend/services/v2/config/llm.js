import { ChatGroq } from "@langchain/groq";
import "./env.js";

export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.1,
});
