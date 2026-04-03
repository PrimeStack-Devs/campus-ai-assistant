import express from "express";
import { runCampusBot } from "../../services/v2/ragPipeline.js";
import { formatGuardrailResponse, formatResponse } from "../../utils/formatResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ error: "What would you like to know about the campus?" });
    }

 
    const threadId = sessionId || "temp_session_" + Date.now();

    //  Invoke the Guardrail-aware Campus Bot wrapper
    const result = await runCampusBot(message, threadId);

    const { reply, replyPlain } =
      result.metadata?.source === "guardrail" || result.metadata?.guardrail
        ? formatGuardrailResponse(result.response)
        : formatResponse(result.response);

    return res.json({
      success: true,
      sessionId: threadId,

      // ── Web (Next.js) ─────────────────────────────────────────────────────
      // Render this with react-markdown or similar.
      reply,

      // ── Mobile (React Native) ─────────────────────────────────────────────
      // Plain text — no markdown symbols. Safe to display in <Text> directly.
      replyPlain,

      // ── Metadata ──────────────────────────────────────────────────────────
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
