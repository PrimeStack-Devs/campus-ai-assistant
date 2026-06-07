/* import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeProfessorService } from "./services/structuredService.js";
import chatRoutes from "./routes/chat.js";
import chatRoutesV2 from "./routes/v2/chat.js";
import { extractPDFDocs } from "./services/pdfProcessor.js";
import { initializeRAG } from "./services/ragPipeline.js";
import { initializeRouter } from "./services/router.js";
import { initializeStore } from "./services/v2/vectorStore.js";
import { connectRedis } from "./config/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
await connectRedis();
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

// API Routes

app.use("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

app.use("/api/chat", chatRoutes);
app.use("/api/v2/chat", chatRoutesV2);

// ============================
// SERVER STARTUP
// ============================

const startServer = async () => {
  try {
    console.log("Starting server initialization...");

    // Load PDF documents
    console.log("Processing PDF...");
    const pdfDocs = await extractPDFDocs(
      path.join(__dirname, "data", "handbook.pdf"),
    );

    // Initialize Static RAG
    console.log("Initializing RAG...");
    await initializeRAG(pdfDocs);
    await initializeProfessorService();

    // Initialize v2 Campus Vector Store
    console.log("Initializing Campus Vector Store...");
    await initializeStore();

    // Initialize Embedding Router
    console.log("Initializing Router...");
    await initializeRouter();

    console.log("System Ready.");

    // Start Express Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();
 */


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { initializeProfessorService } from "./services/structuredService.js";
import chatRoutes from "./routes/chat.js";
import chatRoutesV2 from "./routes/v2/chat.js";
import { extractPDFDocs } from "./services/pdfProcessor.js";
import { initializeRAG } from "./services/ragPipeline.js";
import { initializeRouter } from "./services/router.js";
import { initializeStore } from "./services/v2/vectorStore.js";
import { connectRedis } from "./config/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
  });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/v2/chat", chatRoutesV2);

// Initialize Services
const initializeApp = async () => {
  try {
    console.log("Starting server initialization...");

    await connectRedis();

    console.log("Processing PDF...");
    const pdfDocs = await extractPDFDocs(
      path.join(__dirname, "data", "handbook.pdf")
    );

    console.log("Initializing RAG...");
    await initializeRAG(pdfDocs);

    console.log("Initializing Professor Service...");
    await initializeProfessorService();

    console.log("Initializing Campus Vector Store...");
    await initializeStore();

    console.log("Initializing Router...");
    await initializeRouter();

    console.log("System Ready.");
  } catch (error) {
    console.error("Startup error:", error);
  }
};

// Run initialization once
await initializeApp();

// IMPORTANT FOR VERCEL
export default app;

