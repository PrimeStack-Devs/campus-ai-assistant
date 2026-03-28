import express from "express";
import { askQuestion } from "../services/ragPipeline.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await askQuestion(message);
    // 🔥 Return FULL result object
    return res.json(result);

  } catch (error) {
    console.error("Chat route error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;