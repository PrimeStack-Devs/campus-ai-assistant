import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm.js";

const TITLE_SYSTEM_PROMPT = `You are a concise title generator for a university campus AI assistant.
Given the student's question and the assistant's answer, generate a professional, short 2 to 4 word topic title.

Rules:
1. Exactly 2 to 4 words.
2. Capitalize Each Word (Title Case, e.g. "MCA Department HOD", "C.V. Raman Centre", "Campus Hostels Overview", "Central Library Hours").
3. No punctuation, no quotes, no question marks, no periods.
4. Do NOT use conversational phrases like "Question about", "How to find", "Inquiry on".
5. Output ONLY the title text, nothing else.`;

/**
 * Fast 0ms heuristic title cleaner used immediately on first user keystroke.
 */
export function cleanInitialTitle(query) {
  if (!query) return "New Conversation";

  // Remove common question filler prefixes
  let cleaned = query
    .trim()
    .replace(
      /^(who is|what is|where is|where are|how to reach|how do i get to|how to find|how many|can you tell me about|tell me about|how is|which)\s+/i,
      ""
    )
    .replace(/[?!.,;:]+$/, "")
    .trim();

  if (!cleaned) cleaned = query.trim();

  // Words capitalization
  const words = cleaned.split(/\s+/).slice(0, 5);
  const capitalized = words
    .map((w) => {
      // Keep acronyms like MCA, HOD, CSE, PIET, IT uppercase
      if (w.length <= 4 && /^[a-zA-Z]+$/.test(w) && (w.toUpperCase() === w || ["mca", "hod", "cse", "piet", "pit", "mba", "bba", "cvrc", "btech", "atm", "gym"].includes(w.toLowerCase()))) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return capitalized || "Campus Inquiry";
}

/**
 * Generates a polished 2-4 word topic title using LLM or destination metadata.
 */
export async function generateChatTitle(
  userMessage,
  botReply,
  metadata = null,
  queryType = null
) {
  // If explicitly a location or directions query and destination matched, use that building name
  if (
    (queryType === "location" || queryType === "directions") &&
    metadata?.destination?.name &&
    metadata.destination.name.length <= 32
  ) {
    return metadata.destination.name;
  }

  try {
    const replySnippet = (botReply || "")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 160);
    const prompt = `Student: ${userMessage}\nAssistant: ${replySnippet}\nTitle:`;

    const res = await llm.invoke([
      new SystemMessage(TITLE_SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);

    const title = res.content
      ?.trim()
      ?.replace(/^["']|["']$/g, "")
      ?.replace(/[.!?]+$/, "");

    if (title && title.length >= 3 && title.length <= 40) {
      return title;
    }

    return cleanInitialTitle(userMessage);
  } catch (err) {
    console.warn("[TitleGenerator] Fallback to heuristic:", err.message);
    return cleanInitialTitle(userMessage);
  }
}

