import { HumanMessage } from "@langchain/core/messages";
import { toCampusBotResponse } from "./formatters/responseFormatter.js";
import { campusBot } from "./graph/workflow.js";
import { runGuardrails } from "./guards/guardrailRunner.js";

export { campusBot };
 
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
