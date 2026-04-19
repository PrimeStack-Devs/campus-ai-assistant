import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm.js";
import { NOT_FOUND_PROMPT } from "../../../utils/prompts.js";

export async function createNotFoundResponse(userQuery) {
  const response = await llm.invoke([
    new SystemMessage(NOT_FOUND_PROMPT),
    new HumanMessage(userQuery),
  ]);

  return {
    messages: [
      new AIMessage({
        content: response.content,
        additional_kwargs: {
          metadata: null,
          source: "not_found",
        },
      }),
    ],
  };
}
