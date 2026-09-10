import crypto from "crypto";
import redisClient, { connectRedis } from "../../../config/redis.js";
import { searchTavily } from "./tavilySearch.js";
import { getWebAnswer as getLegacyWebAnswer } from "../../../webCache.js";

async function getRedis() {
  try {
    await connectRedis();
    return redisClient;
  } catch (err) {
    console.warn("[WebRetriever] Redis connection warning:", err.message);
    return null;
  }
}

function getCacheKey(query) {
  const normalized = (query || "").toLowerCase().trim().replace(/\s+/g, " ");
  const hash = crypto.createHash("md5").update(normalized).digest("hex").slice(0, 16);
  return `pu:web:tavily:${hash}`;
}

/**
 * Retrieves web content for a query using Redis cache -> Tavily AI Search -> Legacy webCache fallback.
 *
 * @param {string} query
 * @returns {Promise<{
 *   content: string,
 *   source_id: string,
 *   source_label: string,
 *   source_url: string,
 *   is_url_only: boolean,
 *   cached: boolean,
 *   scraped_at: string,
 *   disclosure: string | null
 * } | null>}
 */
export async function retrieveWebAnswer(query) {
  if (!query || !query.trim()) return null;

  const cacheKey = getCacheKey(query);
  const redis = await getRedis();

  // 1. Check Redis Cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[WebRetriever] Redis HIT: ${cacheKey}`);
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          cached: true,
        };
      }
    } catch (err) {
      console.warn("[WebRetriever] Redis get error:", err.message);
    }
  }

  // 2. Perform live Tavily AI Web Search
  try {
    const tavilyResult = await searchTavily(query);

    if (tavilyResult && tavilyResult.success) {
      const answerPayload = {
        content: tavilyResult.content,
        source_id: "tavily_search",
        source_label: tavilyResult.source_label,
        source_url: tavilyResult.source_url,
        is_official: tavilyResult.is_official,
        is_url_only: false,
        cached: false,
        scraped_at: tavilyResult.scraped_at,
        disclosure: tavilyResult.is_official
          ? null
          : "This information is from an external web source and may not reflect the latest official campus notice.",
      };

      // Store in Redis with a 48-hour TTL (172,800 seconds)
      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(answerPayload), {
            EX: 48 * 3600,
          });
          console.log(`[WebRetriever] Cached live result in Redis -> ${cacheKey} (TTL: 48h)`);
        } catch (err) {
          console.warn("[WebRetriever] Redis set error:", err.message);
        }
      }

      return answerPayload;
    }
  } catch (err) {
    console.error("[WebRetriever] Tavily retrieval error:", err.message);
  }

  // 3. Fall back to legacy keyword matcher / webCache if Tavily is unavailable
  console.log("[WebRetriever] Attempting legacy webCache fallback...");
  try {
    const legacyResult = await getLegacyWebAnswer(query);
    if (legacyResult) {
      console.log(`[WebRetriever] Legacy match found: ${legacyResult.source_label}`);
      return legacyResult;
    }
  } catch (err) {
    console.error("[WebRetriever] Legacy webCache error:", err.message);
  }

  return null;
}
