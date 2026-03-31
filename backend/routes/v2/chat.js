import express from "express";
import { runCampusBot } from "../../services/v2/ragPipeline.js";

const router = express.Router();

/**
 * POST /api/chat
 * Handles campus queries with Session Management
 */
router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // 1. Validation
    if (!message) {
      return res
        .status(400)
        .json({ error: "What would you like to know about the campus?" });
    }

    // 2. Session Management (Crucial for Deployment)
    // If no sessionId is provided by frontend, we fallback to a global one (not recommended for production)
    const threadId = sessionId || "temp_session_" + Date.now();

    // 3. Invoke the Guardrail-aware Campus Bot wrapper
    const result = await runCampusBot(message, threadId);

    // 4. Perfect Response Object
    return res.json({
      success: true,
      sessionId: threadId,
      reply: result.response,
      data: result.metadata || null,
      queryType: result.query_type || null,
      source: result.source || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Route Error:", error);

    // User-friendly error messages
    return res.status(500).json({
      success: false,
      error:
        "I'm having trouble accessing the campus database right now. Please try again in a moment.",
    });
  }
});

export default router;
