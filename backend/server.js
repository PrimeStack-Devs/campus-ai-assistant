import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import campusRoutes from "./routes/campus.js";
import { initializeStore } from "./services/vectorStore.js";
import { connectRedis } from "./config/redis.js";
import { connectDB } from "./config/db.js";

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
    message: "Kryvix AI Campus API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Canonical Routes
app.use("/api/chat", chatRoutes);
app.use("/api/v2/chat", chatRoutes); // Backward compatibility alias
app.use("/api/admin", adminRoutes);
app.use("/api/campus", campusRoutes);

const initializeApp = async () => {
  try {
    const startTime = Date.now();
    console.log("🚀 Starting Kryvix AI Server initialization...");

    // 1. Connect Redis Cache
    try {
      await connectRedis();
    } catch (redisErr) {
      console.warn("⚠️ Redis unavailable, proceeding without cache:", redisErr.message);
    }

    // 2. Connect Database (with graceful fallback to local persistent store)
    try {
      await connectDB();
    } catch (dbErr) {
      console.log("ℹ️ Running with local persistent data store in backend/data/db/");
    }

    // 3. Fast Vector Store Initialization (< 50ms)
    await initializeStore();

    console.log(`✅ System Ready in ${Date.now() - startTime}ms (Cold start eliminated).`);
  } catch (error) {
    console.error("❌ Startup error:", error);
  }
};

await initializeApp();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
