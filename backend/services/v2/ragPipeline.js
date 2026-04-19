import { HumanMessage } from "@langchain/core/messages";
import { toCampusBotResponse } from "./formatters/responseFormatter.js";
import { campusBot } from "./graph/workflow.js";
import { runGuardrails } from "./guards/guardrailRunner.js";

export { campusBot };

/**
 * runCampusBot(userMessage, threadId)
 *
 * Single entry point for all v2 queries.
 * Always call this instead of invoking the graph directly.
 *
 * @param {string} userMessage
 * @param {string} threadId
 * @returns {{ response, metadata, query_type, source }}
 */
export async function runCampusBot(userMessage, threadId = "default") {
  const guardrailResponse = runGuardrails(userMessage);

  if (guardrailResponse) {
    return guardrailResponse;
  }

  const result = await campusBot.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId } },
  );

  const lastMessage = result.messages[result.messages.length - 1];

  return toCampusBotResponse(lastMessage);
}
