import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeProfessorService } from "./services/structuredService.js";
import chatRoutes from "./routes/chat.js";
import { extractPDFDocs } from "./services/pdfProcessor.js";
import { initializeRAG } from "./services/ragPipeline.js";
import { initializeRouter } from "./services/router.js";
import 'dotenv/config';
import { connectRedis } from './config/redis.js';

await connectRedis(); // ✅ THIS IS IMPORTANT
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/chat", chatRoutes);

// ============================
// SERVER STARTUP
// ============================

const startServer = async () => {
  try {
    console.log("Starting server initialization...");

    // 1️⃣ Load PDF documents
    console.log("Processing PDF...");
    const pdfDocs = await extractPDFDocs("./data/handbook.pdf");

    // 2️⃣ Initialize Static RAG
    console.log("Initializing RAG...");
    await initializeRAG(pdfDocs);
    await initializeProfessorService();

    // 3️⃣ Initialize Embedding Router
    console.log("Initializing Router...");
    await initializeRouter();

    console.log("System Ready.");

    // 4️⃣ Start Express Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();