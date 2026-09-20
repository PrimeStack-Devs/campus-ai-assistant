import express from "express";
import { Document } from "@langchain/core/documents";
import { embeddings } from "../services/v2/vector/embeddings.js";
import { addDynamicDocuments } from "../services/v2/vector/store.js";

const router = express.Router();

/**
 * POST /api/feedback
 *
 * Body: { query: string, answer: string, isCorrect: boolean }
 *
 * When isCorrect is true, the query + answer pair is embedded and added
 * to the live vector store so future retrieval improves.
 */
router.post("/", async (req, res) => {
  try {
    const { query, answer, isCorrect } = req.body;

    if (!query || !answer || typeof isCorrect !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: query, answer, isCorrect",
      });
    }

    if (!isCorrect) {
      console.log(`[Feedback] ❌ Negative feedback logged for: "${query.slice(0, 60)}..."`);
      return res.json({
        success: true,
        message: "Negative feedback recorded. Thank you!",
        addedToKnowledgeBase: false,
      });
    }

    // Build a document from the confirmed Q&A
    const pageContent = `Question: ${query}\nAnswer: ${answer}`;
    const doc = new Document({
      pageContent,
      metadata: {
        source: "user_feedback",
        category: "confirmed_answer",
        query,
        confirmedAt: new Date().toISOString(),
      },
    });

    // Generate embedding vector
    const vector = await embeddings.embedQuery(pageContent);

    // Add to live vector store + persist to precomputed_vectors.json
    await addDynamicDocuments([doc], [vector]);

    console.log(`[Feedback] ✅ Confirmed answer added to knowledge base for: "${query.slice(0, 60)}..."`);

    return res.json({
      success: true,
      message: "Thank you! This answer has been added to the knowledge base.",
      addedToKnowledgeBase: true,
    });
  } catch (error) {
    console.error("❌ Feedback route error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process feedback. Please try again.",
    });
  }
});

export default router;
