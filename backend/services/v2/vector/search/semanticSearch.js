import { getStore } from "../store.js";
import { Document } from "@langchain/core/documents";

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHonorifics(str) {
  return normalize(str)
    .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.|er\.|shri|smt\.)\s+/gi, "")
    .trim();
}

export function calculateEntityBoost(queryNorm, meta = {}) {
  let boost = 0;
  if (!queryNorm) return 0;

  const aliases = (meta.aliases || []).map((a) => normalize(a)).filter(Boolean);
  const strippedName = stripHonorifics(meta.name || meta.label || meta.title);
  const code = normalize(meta.code || meta.short_name);
  const category = meta.category;
  const role = normalize(meta.designation || meta.role);
  const deptName = normalize(meta.department_name || meta.department_id);

  // 1. Name token matching with multi-token reward
  const nameTokens = strippedName.split(/\s+/).filter((t) => t.length > 2);
  if (nameTokens.length > 0) {
    const matchedTokens = nameTokens.filter((t) => {
      const reg = new RegExp(`\\b${t}\\b`, "i");
      return reg.test(queryNorm);
    });
    if (matchedTokens.length > 0) {
      if (nameTokens.length > 1 && matchedTokens.length === nameTokens.length) {
        boost += 0.70; // Full multi-word name match (e.g. Pallavi Khedkar)
      } else if (nameTokens.length === 1 && matchedTokens.length === 1) {
        boost += 0.25; // Only single name matched
      } else if (matchedTokens.length > 0) {
        boost += 0.20 * matchedTokens.length;
      }
    }
  }

  // 2. Exact alias match (with word boundary)
  for (const alias of aliases) {
    if (alias.length >= 3) {
      const aliasReg = new RegExp(`(^|\\s)${alias}($|\\s)`, "i");
      if (aliasReg.test(queryNorm)) {
        boost += 0.50;
        break;
      }
    }
  }

  // 3. Department specific role matching
  const isHodQuery = /\b(hod|head of department|head of|head)\b/.test(queryNorm);
  if (isHodQuery) {
    let deptMatch = false;
    if (code && code.length >= 2) {
      const codeReg = new RegExp(`\\b${code}\\b`, "i");
      if (codeReg.test(queryNorm)) deptMatch = true;
    }
    if (deptName && deptName.length >= 3) {
      const deptTokens = deptName
        .split(/\s+/)
        .filter((t) => t.length > 3 && !["department", "faculty"].includes(t));
      if (deptTokens.some((dt) => queryNorm.includes(dt))) deptMatch = true;
    }

    if (deptMatch) {
      if (category === "Department") boost += 0.40;
      if (category === "Faculty" && (role.includes("hod") || role.includes("head"))) boost += 0.50;
    }
  }

  // 4. Special units (e.g. career development cell)
  if (
    queryNorm.includes("career development") &&
    (role.includes("career development") ||
      deptName.includes("career development") ||
      aliases.some((a) => a.includes("career development")))
  ) {
    boost += 0.60;
  }

  return boost;
}

export const searchCampusData = async (query, limit = 2) => {
  const vectorStore = getStore();
  if (!vectorStore) throw new Error("Vector Store not initialized!");

  const queryNorm = normalize(query);
  const searchPoolSize = Math.max(limit * 4, 30);
  const rawResults = await vectorStore.similaritySearchWithScore(query, searchPoolSize);

  const resultMap = new Map();

  // Add semantic search candidates with hybrid boost
  for (const [doc, score] of rawResults) {
    const meta = doc.metadata || {};
    const id = meta.id || doc.pageContent.slice(0, 50);
    const boost = calculateEntityBoost(queryNorm, meta);
    resultMap.set(id, {
      doc,
      score: score + boost,
      originalScore: score,
      boost,
    });
  }

  // Scan memoryVectors for direct alias or name hits that might have fallen outside semantic top 30
  if (vectorStore.memoryVectors && Array.isArray(vectorStore.memoryVectors)) {
    for (const mv of vectorStore.memoryVectors) {
      const meta = mv.metadata || {};
      const id = meta.id || mv.content.slice(0, 50);
      if (resultMap.has(id)) continue;

      const boost = calculateEntityBoost(queryNorm, meta);
      if (boost >= 0.40) {
        const doc = new Document({
          pageContent: mv.content,
          metadata: meta,
        });
        resultMap.set(id, {
          doc,
          score: 0.35 + boost,
          originalScore: 0.35,
          boost,
        });
      }
    }
  }

  const sorted = Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
  return sorted.slice(0, limit).map((item) => [item.doc, item.score]);
};
