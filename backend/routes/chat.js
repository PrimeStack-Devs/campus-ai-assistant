import express from "express";
import { runCampusBot } from "../services/v2/ragPipeline.js";
import {
  formatGuardrailResponse,
  formatResponse,
} from "../utils/formatResponse.js";
import { generateChatTitle } from "../services/v2/utils/titleGenerator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, sessionId, messageCount, existingTitle } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ error: "What would you like to know about the campus?" });
    }

    const threadId = sessionId || "temp_session_" + Date.now();

    // Invoke the Guardrail-aware Campus Bot wrapper
    const result = await runCampusBot(message, threadId);

    const { reply, replyPlain } =
      result.metadata?.source === "guardrail" || result.metadata?.guardrail
        ? formatGuardrailResponse(result.response)
        : formatResponse(result.response);

    // Keep title stable: only generate/refine on prompt 1 or prompt 2
    const userTurn = messageCount || result.userMessageCount || 1;
    let title = existingTitle || null;

    if (userTurn <= 2) {
      title = await generateChatTitle(
        message,
        replyPlain || reply,
        result.metadata,
        result.query_type
      );
    }

    return res.json({
      success: true,
      sessionId: threadId,

      // Web (Next.js) - rendered with markdown
      reply,

      // Mobile / Plain text
      replyPlain,

      // Smart conversation title
      title,

      // Metadata
      data: result.metadata || null,
      queryType: result.query_type || null,
      source: result.source || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Route Error:", error);

    return res.status(500).json({
      success: false,
      error:
        "I'm having trouble accessing the campus database right now. Please try again in a moment.",
    });
  }
});

export default router;
