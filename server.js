import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import chatRoutes from "./routes/chat.js";
import { extractPDFDocs } from "./services/pdfProcessor.js";
import { scrapePage } from "./services/scraper.js";
import { initializeRAG } from "./services/ragPipeline.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);

const startServer = async () => {
  try {
    console.log("Processing PDF...");

    // 1️⃣ Load PDF
    const pdfDocsRaw = await extractPDFDocs("./data/handbook.pdf");

    const pdfDocs = pdfDocsRaw.map(doc => ({
      ...doc,
      metadata: { source: "handbook.pdf" }
    }));


    // 2️⃣ Load locations.json (ONE DOCUMENT PER LOCATION)
    console.log("Loading structured location data...");

    const locationData = JSON.parse(
      fs.readFileSync("./data/locations.json", "utf-8")
    );

    const locationDocs = Object.entries(locationData).map(
      ([key, value]) => ({
        pageContent: `${key} is located at ${value}`,
        metadata: { source: "locations.json" }
      })
    );


    // 3️⃣ Scrape Website
    console.log("Scraping website content...");

    const scrapedText = await scrapePage("https://paruluniversity.ac.in/life-at-pu/");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const scrapedDocsRaw = await splitter.createDocuments([scrapedText]);

    const scrapedDocs = scrapedDocsRaw.map(doc => ({
      ...doc,
      metadata: { source: "website" }
    }));

console.log("data",scrapedDocs)
    // 4️⃣ Combine ALL sources
    const allDocs = [
      ...pdfDocs,
      ...locationDocs,
      ...scrapedDocs
    ];

    await initializeRAG(allDocs);

    console.log("RAG Initialized");

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });

  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();