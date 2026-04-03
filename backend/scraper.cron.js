/**
 * 
 * Cron schedules:
 *   - daily_midnight  → 0 0 * * *   (informational sources)
 *   - twice_daily     → 0 0,12 * * * (dynamic sources)
 *   - weekly          → 0 0 * * 0   (legal + external sources)
 */

import cron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import redis, { connectRedis } from './config/redis.js';

dotenv.config();

// ─── Setup ───────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load web sources config
const webSources = JSON.parse(
  readFileSync(join(__dirname, '../campus-data/web_sources.json'), 'utf-8')
);

await connectRedis();

// ─── Scraper ─────────────────────────────────────────────────────────────────

/**
 * Scrapes a URL and extracts readable text content using Cheerio.
 * Removes scripts, styles, navbars, footers for clean content.
 */
async function scrapeUrl(url, extractHint) {
  try {
    const response = await axios.get(url, {
      timeout: parseInt(process.env.SCRAPE_TIMEOUT_MS) || 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ParulCampusBot/1.0; +https://paruluniversity.ac.in)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const $ = cheerio.load(response.data);

    // Remove noise elements
    $('script, style, nav, footer, header, iframe, .cookie-banner, .popup').remove();

    // Try to get main content
    const mainSelectors = ['main', 'article', '.content', '.page-content', '#content', '.entry-content', 'section'];
    let text = '';

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        text = el.text();
        break;
      }
    }

    // Fallback to body
    if (!text || text.trim().length < 100) {
      text = $('body').text();
    }

    // Clean whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 8000); // cap at 8000 chars to keep Redis lean

    return {
      success: true,
      url,
      extract_hint: extractHint,
      content: text,
      scraped_at: new Date().toISOString()
    };

  } catch (err) {
    console.error(`[Scraper] Failed to scrape ${url}:`, err.message);
    return {
      success: false,
      url,
      content: null,
      error: err.message,
      scraped_at: new Date().toISOString()
    };
  }
}

// ─── Cache Writer ─────────────────────────────────────────────────────────────

/**
 * Scrapes a source and stores the result in Redis.
 * TTL is set from source.redis.ttl_hours.
 */
async function scrapeAndCache(source) {
  const { id, label, url, fetch_strategy, redis: redisConfig } = source;

  // Skip sources that should not be scraped
  if (!fetch_strategy.scrape) {
    console.log(`[Cron] Skipping ${label} — scrape=false (URL-only source)`);
    return;
  }

  console.log(`[Cron] Scraping: ${label} → ${url}`);

  const result = await scrapeUrl(url, fetch_strategy.extract);

  if (!result.success) {
    console.warn(`[Cron] ⚠ Failed: ${label}`);

    // Store failure marker so agent knows scrape failed
    await redis.set(
      `${redisConfig.key}:error`,
      JSON.stringify({ error: result.error, at: result.scraped_at }),
      { EX: 3600 } // retry signal expires in 1 hour
    );
    return;
  }

  const payload = JSON.stringify(result);
  const ttlSeconds = redisConfig.ttl_hours * 3600;

  await redis.set(redisConfig.key, payload, { EX: ttlSeconds });

  console.log(`[Cron] ✓ Cached: ${label} | TTL: ${redisConfig.ttl_hours}h | Key: ${redisConfig.key}`);
}

// ─── Group Sources by Cron Schedule ──────────────────────────────────────────

function getSourcesByCron(cronLabel) {
  return webSources.sources.filter(
    (src) => src.redis.cron_label === cronLabel
  );
}

// ─── Run All Sources in a Group ───────────────────────────────────────────────

async function runGroup(cronLabel) {
  const sources = getSourcesByCron(cronLabel);
  console.log(`\n[Cron] ─── Running group: ${cronLabel} (${sources.length} sources) ───`);

  const results = await Promise.allSettled(
    sources.map((src) => scrapeAndCache(src))
  );

  const passed = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[Cron] Group ${cronLabel} done — ✓ ${passed} passed, ✗ ${failed} failed\n`);
}

// ─── Cron Jobs ────────────────────────────────────────────────────────────────

// Daily at midnight — informational sources (about, awards, research, etc.)
cron.schedule('0 0 * * *', async () => {
  console.log(`[Cron] ${new Date().toISOString()} — Running daily_midnight job`);
  await runGroup('daily_midnight');
}, {
  timezone: 'Asia/Kolkata'
});

// Twice daily — dynamic sources (placements, admissions, careers, etc.)
cron.schedule('0 0,12 * * *', async () => {
  console.log(`[Cron] ${new Date().toISOString()} — Running twice_daily job`);
  await runGroup('twice_daily');
}, {
  timezone: 'Asia/Kolkata'
});

// Weekly on Sunday — legal and external sources
cron.schedule('0 0 * * 0', async () => {
  console.log(`[Cron] ${new Date().toISOString()} — Running weekly job`);
  await runGroup('weekly');
}, {
  timezone: 'Asia/Kolkata'
});

// ─── Startup Warm-Up ──────────────────────────────────────────────────────────

/**
 * On server start, check which Redis keys are missing or expired
 * and immediately scrape those sources to warm the cache.
 * This prevents cold-start cache misses.
 */
async function warmCache() {
  console.log('\n[Startup] Warming Redis cache — checking missing keys...\n');

  const missing = [];

  for (const source of webSources.sources) {
    if (!source.fetch_strategy.scrape) continue;
    if (!source.redis.key) continue;

    const exists = await redis.exists(source.redis.key);
    if (!exists) {
      missing.push(source);
    }
  }

  if (missing.length === 0) {
    console.log('[Startup] All cache keys present. No warm-up needed.\n');
    return;
  }

  console.log(`[Startup] ${missing.length} keys missing. Scraping now...\n`);

  await Promise.allSettled(missing.map((src) => scrapeAndCache(src)));

  console.log('[Startup] Cache warm-up complete.\n');
}

await warmCache();

// ─── Manual Trigger (for testing) ────────────────────────────────────────────

/**
 * Force-scrape a specific source by ID.
 * Usage: node scraper.cron.js --force src_placements
 * 
 * Useful for testing or manually refreshing a stale source.
 */
if (process.argv.includes('--force')) {
  const targetId = process.argv[process.argv.indexOf('--force') + 1];
  const source = webSources.sources.find((s) => s.id === targetId);

  if (!source) {
    console.error(`[Force] Source not found: ${targetId}`);
    console.log('Available IDs:', webSources.sources.map((s) => s.id).join(', '));
    process.exit(1);
  }

  console.log(`[Force] Manually scraping: ${source.label}`);
  await scrapeAndCache(source);
  console.log('[Force] Done.');
  process.exit(0);
}

console.log('\n[Cron] Scraper running. Scheduled jobs active.');
console.log('  → daily_midnight  : 12:00 AM IST — informational sources');
console.log('  → twice_daily     : 12:00 AM & 12:00 PM IST — dynamic sources');
console.log('  → weekly          : Sunday 12:00 AM IST — legal & external sources\n');
