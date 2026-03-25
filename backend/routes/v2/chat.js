import express from "express";
import { campusBot } from "../../services/v2/ragPipeline.js";
import { HumanMessage } from "@langchain/core/messages";

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

    // 3. Configure the Graph Execution
    // The 'thread_id' tells LangGraph which conversation history to load from MemorySaver
    const config = {
      configurable: { thread_id: threadId },
    };

    // 4. Invoke the Pipeline
    const result = await campusBot.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      config,
    );

    // 5. Extract the Final Response
    // LangGraph returns the full state; we want the last message generated
    const lastMsg = result.messages[result.messages.length - 1];

    // 6. Perfect Response Object
    return res.json({
      success: true,
      sessionId: threadId,
      reply: lastMsg.content,
      // If we found specific JSON metadata (like building coordinates), send it back
      data: lastMsg.additional_kwargs?.metadata || null,
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
