import express from "express";
import { askQuestion } from "../services/ragPipeline.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const result = await askQuestion(message);

    res.json({
      reply: result.answer,
      sources: result.sources,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;