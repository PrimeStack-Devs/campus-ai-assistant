import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm.js";
import { buildWebFallbackPrompt } from "../prompts/buildWebFallbackPrompt.js";
import { retrieveWebAnswer } from "../retrieval/webRetriever.js";
import { createNotFoundResponse } from "./handleNotFound.js";

export const callWebSearch = async (state) => {
  const userQuery = state.messages[state.messages.length - 2].content;

  console.log(`[Graph] Web fallback | query: "${userQuery}"`);

  const webAnswer = await retrieveWebAnswer(userQuery);

  if (!webAnswer) {
    console.log("[Graph] Web fallback returned nothing - not found response");
    return await createNotFoundResponse(userQuery);
  }

  if (webAnswer.is_url_only) {
    return {
      messages: [
        new AIMessage({
          content: `For this, the best place to check is the official page: ${webAnswer.source_label}\n${webAnswer.source_url}`,
          additional_kwargs: {
            metadata: {
              type: "web_source",
              source_id: webAnswer.source_id || null,
              source_label: webAnswer.source_label,
              source_url: webAnswer.source_url,
              cached: webAnswer.cached,
              is_url_only: true,
              disclosure: webAnswer.disclosure || null,
            },
            source: "web_url_only",
          },
        }),
      ],
    };
  }

  const webSystemPrompt = buildWebFallbackPrompt(webAnswer, userQuery);
  const response = await llm.invoke([
    new SystemMessage(webSystemPrompt),
    new HumanMessage(
      [
        webAnswer.source_id ? `Source ID: ${webAnswer.source_id}` : "",
        `Source: ${webAnswer.source_label}`,
        `URL: ${webAnswer.source_url}`,
        webAnswer.disclosure ? `Disclosure: ${webAnswer.disclosure}` : "",
        "",
        "Content:",
        webAnswer.content,
        "",
        `Student Question: ${userQuery}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ]);

  return {
    messages: [
      new AIMessage({
        content: response.content,
        additional_kwargs: {
          metadata: {
            type: "web_source",
            source_id: webAnswer.source_id || null,
            source_label: webAnswer.source_label,
            source_url: webAnswer.source_url,
            cached: webAnswer.cached,
            scraped_at: webAnswer.scraped_at || null,
            disclosure: webAnswer.disclosure || null,
          },
          source: "web",
        },
      }),
    ],
  };
};
