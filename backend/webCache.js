/**
 * 
 * Flow:
 *   1. matchSource(query)  → finds the best matching source from web_sources.json
 *   2. getFromCache(source) → checks Redis for cached content
 *   3. fetchLive(source)    → if Redis miss, scrapes live and updates Redis
 *   4. getWebAnswer(query)  → full pipeline in one call
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import redisClient, { connectRedis } from './config/redis.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load sources config once at module load
const webSources = JSON.parse(
  readFileSync(join(__dirname, 'campus-data/web_sources.json'), 'utf-8')
);

async function getRedis() {
  await connectRedis();
  return redisClient;
}

// ─── 1. Match Source ──────────────────────────────────────────────────────────

/**
 * Finds the best matching web source for a given query string.
 * Uses keyword overlap scoring + priority tiebreaker.
 * 
 * @param {string} query - User's query
 * @returns {object|null} - Best matching source or null
 */
export function matchSource(query) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let bestSource = null;
  let bestScore = 0;

  for (const source of webSources.sources) {
    let score = 0;

    for (const keyword of source.intent_keywords) {
      const keywordLower = keyword.toLowerCase();

      // Exact phrase match — highest weight
      if (queryLower.includes(keywordLower)) {
        score += 3;
        continue;
      }

      // Partial word match — lower weight
      const keywordWords = keywordLower.split(/\s+/);
      const matches = keywordWords.filter((w) => queryWords.includes(w));
      score += matches.length * 1;
    }

    // Tiebreaker — prefer lower priority number (1 = most relevant)
    const adjustedScore = score - (source.priority * 0.1);

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestSource = source;
    }
  }

  // Minimum threshold — avoid false matches
  return bestScore >= 2 ? bestSource : null;
}

// ─── 2. Get From Redis Cache ──────────────────────────────────────────────────

/**
 * Retrieves cached content for a source from Redis.
 * 
 * @param {object} source - Source object from web_sources.json
 * @returns {object|null} - Parsed cached result or null on miss
 */
export async function getFromCache(source) {
  if (!source.redis?.key || source.redis.ttl_hours === 0) return null;

  try {
    const redis = await getRedis();
    const cached = await redis.get(source.redis.key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    console.log(`[WebCache] Cache HIT: ${source.redis.key}`);
    return parsed;

  } catch (err) {
    console.error('[WebCache] Redis get error:', err.message);
    return null;
  }
}

// ─── 3. Fetch Live & Cache ────────────────────────────────────────────────────

/**
 * Scrapes a source URL live, caches the result in Redis, and returns content.
 * Only called on cache miss.
 * 
 * @param {object} source - Source object from web_sources.json
 * @returns {object|null} - Scraped result or null on failure
 */
export async function fetchLive(source) {
  if (!source.fetch_strategy.scrape) {
    // URL-only sources — return just the URL, never scrape
    return {
      success: true,
      url: source.url,
      content: null,
      is_url_only: true,
      scraped_at: new Date().toISOString()
    };
  }

  console.log(`[WebCache] Cache MISS — fetching live: ${source.label}`);

  try {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ParulCampusBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    const $ = cheerio.load(response.data);
    $('script, style, nav, footer, header, iframe').remove();

    const mainSelectors = ['main', 'article', '.content', '.page-content', '#content', '.entry-content', 'section'];
    let text = '';

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        text = el.text();
        break;
      }
    }

    if (!text || text.trim().length < 100) {
      text = $('body').text();
    }

    text = text.replace(/\s+/g, ' ').trim().slice(0, 8000);

    const result = {
      success: true,
      url: source.url,
      content: text,
      scraped_at: new Date().toISOString()
    };

    // Cache the result if TTL > 0
    if (source.redis?.key && source.redis.ttl_hours > 0) {
      const redis = await getRedis();
      const ttlSeconds = source.redis.ttl_hours * 3600;
      await redis.set(source.redis.key, JSON.stringify(result), { EX: ttlSeconds });
      console.log(`[WebCache] Cached live result → ${source.redis.key} (TTL: ${source.redis.ttl_hours}h)`);
    }

    return result;

  } catch (err) {
    console.error(`[WebCache] Live fetch failed for ${source.label}:`, err.message);
    return null;
  }
}

// ─── 4. Full Pipeline ─────────────────────────────────────────────────────────

/**
 * Main entry point for the agent's web fallback layer.
 * 
 * Usage in your query pipeline:
 *   const webAnswer = await getWebAnswer(userQuery);
 *   if (webAnswer) { use webAnswer.content, webAnswer.source_url }
 * 
 * @param {string} query - User's natural language query
 * @returns {object|null} - { content, source_url, source_label, is_url_only, cached } or null
 */
export async function getWebAnswer(query) {
  // Step 1 — find best matching source
  const source = matchSource(query);

  if (!source) {
    console.log('[WebCache] No matching web source found for query.');
    return null;
  }

  console.log(`[WebCache] Matched source: ${source.label} (${source.id})`);

  // Step 2 — URL-only sources, return immediately
  if (!source.fetch_strategy.scrape) {
    return {
      content: null,
      source_id: source.id,
      source_url: source.url,
      source_label: source.label,
      is_url_only: true,
      cached: false,
      disclosure: source.type === 'external'
        ? 'This information is from a third-party source and may not reflect the official university position.'
        : null
    };
  }

  // Step 3 — check Redis cache
  const cached = await getFromCache(source);
  if (cached) {
    return {
      content: cached.content,
      source_id: source.id,
      source_url: source.url,
      source_label: source.label,
      is_url_only: false,
      cached: true,
      scraped_at: cached.scraped_at,
      disclosure: source.type === 'external'
        ? 'This information is from a third-party source and may not reflect the official university position.'
        : null
    };
  }

  // Step 4 — live fetch on cache miss
  const live = await fetchLive(source);
  if (!live) {
    return null;
  }

  return {
    content: live.content,
    source_id: source.id,
    source_url: source.url,
    source_label: source.label,
    is_url_only: false,
    cached: false,
    scraped_at: live.scraped_at,
    disclosure: source.type === 'external'
      ? 'This information is from a third-party source and may not reflect the official university position.'
      : null
  };
}

// ─── Utility: Force Invalidate a Cache Key ───────────────────────────────────

/**
 * Deletes a Redis key to force a fresh scrape on next query.
 * Useful when you know a page has updated and don't want to wait for TTL.
 * 
 * @param {string} sourceId - The source id from web_sources.json
 */
export async function invalidateCache(sourceId) {
  const source = webSources.sources.find((s) => s.id === sourceId);
  if (!source?.redis?.key) {
    console.warn(`[WebCache] Cannot invalidate — source not found: ${sourceId}`);
    return;
  }

  const redis = await getRedis();
  await redis.del(source.redis.key);
  console.log(`[WebCache] Cache invalidated: ${source.redis.key}`);
}

// ─── Utility: Get Cache Status ────────────────────────────────────────────────

/**
 * Returns the cache status of all sources — hit/miss + TTL remaining.
 * Useful for an admin dashboard or health check endpoint.
 */
export async function getCacheStatus() {
  const redis = await getRedis();
  const status = [];

  for (const source of webSources.sources) {
    if (!source.redis?.key) continue;

    const exists = await redis.exists(source.redis.key);
    const ttl = exists ? await redis.ttl(source.redis.key) : -1;

    status.push({
      id: source.id,
      label: source.label,
      key: source.redis.key,
      cached: exists === 1,
      ttl_remaining_seconds: ttl,
      ttl_remaining_hours: ttl > 0 ? (ttl / 3600).toFixed(1) : null,
      scrape_enabled: source.fetch_strategy.scrape,
      cron: source.redis.cron_label
    });
  }

  return status;
}
