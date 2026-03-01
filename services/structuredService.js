import professors from "../data/professors.json" assert { type: "json" };
import { pipeline } from "@xenova/transformers";
import { cosineSimilarity } from "../utils/similarity.js";

let embedder;
let professorVectors = [];

// ============================
// INITIALIZE PROFESSOR VECTORS
// ============================

export const initializeProfessorService = async () => {
  console.log("Initializing professor semantic matcher...");

  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  professorVectors = [];

  for (const prof of professors) {
    const profileText = `
      Name: ${prof.name}
      Role: ${prof.role}
      Department: ${prof.department || ""}
    `;

    const output = await embedder(profileText, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(
      output.data ?? output[0]?.data ?? output[0]
    );

    professorVectors.push({
      ...prof,
      vector,
    });
  }

  console.log("Professor semantic matcher ready.");
};

// ============================
// SEMANTIC MATCH
// ============================

export const findProfessorMatches = async (query) => {
  if (!embedder || professorVectors.length === 0) {
    console.log("Professor service not initialized.");
    return null;
  }

  const output = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const queryVector = Array.from(
    output.data ?? output[0]?.data ?? output[0]
  );

  const scored = professorVectors.map((prof) => ({
    ...prof,
    score: cosineSimilarity(queryVector, prof.vector),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topMatch = scored[0];

  const THRESHOLD = 0.55;

  if (topMatch && topMatch.score > THRESHOLD) {
    return [topMatch];
  }

  return null;
};