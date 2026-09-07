import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm.js";

const CONTEXTUALIZE_SYSTEM_PROMPT = `You are an expert query contextualizer for a campus guide AI.
Given a chat history between a student and campus AI, and the student's latest follow-up question, reformulate the latest question into a self-contained, standalone search query that can be understood WITHOUT the chat history.

Rules:
1. Do NOT answer the question. Only output the reformulated question.
2. Resolve all pronouns ("he", "she", "it", "they", "there", "his", "her", "their", "that", "this") using specific names, buildings, or topics mentioned in the chat history.
3. If the question is ALREADY standalone and doesn't refer to previous messages, return it EXACTLY as it is.
4. Keep it concise, natural, and keyword-rich for a vector search engine.
5. Output ONLY the reformulated question text, with no quotes, explanations, or extra commentary.`;

/**
 * Contextualizes a follow-up query against previous conversation messages.
 * If the conversation has no history (Turn 1), returns the query immediately with 0ms overhead.
 *
 * @param {Array} messages - LangChain message array from state.messages
 * @returns {Promise<string>} Standalone search query
 */
export async function contextualizeQuery(messages) {
  if (!messages || messages.length <= 1) {
    return messages?.[messages.length - 1]?.content || "";
  }

  const lastUserMsg = messages[messages.length - 1]?.content || "";

  // Quick heuristic: If query is long and has no pronouns, skip LLM rewriting
  const hasPronounOrFollowup =
    /\b(he|she|him|her|his|hers|it|its|they|them|their|theirs|there|here|that|this|these|those|which|who|where|how|and|also|what about)\b/i.test(
      lastUserMsg,
    );

  const wordCount = lastUserMsg.trim().split(/\s+/).length;
  if (!hasPronounOrFollowup && wordCount >= 6) {
    return lastUserMsg;
  }

  try {
    // Extract up to the last 4 messages (2 full conversation turns) as context
    const recentMessages = messages.slice(-5, -1);
    if (recentMessages.length === 0) {
      return lastUserMsg;
    }

    const conversationHistory = recentMessages
      .map((m) => {
        const type = typeof m.getType === "function" ? m.getType() : m._getType?.() || "human";
        const role = type === "human" ? "Student" : "Assistant";
        return `${role}: ${m.content}`;
      })
      .join("\n");

    const prompt = `Chat History:\n${conversationHistory}\n\nLatest Question: ${lastUserMsg}\n\nStandalone Question:`;

    const response = await llm.invoke([
      new SystemMessage(CONTEXTUALIZE_SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);

    const rewritten = response.content?.trim().replace(/^["']|["']$/g, "");

    if (rewritten && rewritten.length > 0) {
      console.log(
        `[Contextualizer] Rewrote "${lastUserMsg}" ➔ "${rewritten}"`,
      );
      return rewritten;
    }

    return lastUserMsg;
  } catch (err) {
    console.warn(
      `[Contextualizer] Error during query rewriting: ${err.message}. Using raw query.`,
    );
    return lastUserMsg;
  }
}
