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
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
  });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/v2/chat", chatRoutesV2);
 
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
 
await initializeApp();

if(process.env.NODE_ENV !== "production"){
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
 
export default app;

