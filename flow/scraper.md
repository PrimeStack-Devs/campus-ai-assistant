# `scraper.cron.js` — Scheduled Scraping Daemon

**Location:** `scraper.cron.js`  
**Role:** Runs as a background process (separate from the Express server). Reads `web_sources.json` and keeps Redis populated with fresh scraped content on a schedule. Also warms the cache on startup and supports manual force-scraping.

---

## Module Map

```
scraper.cron.js
│
├── Setup
│   ├── Load web_sources.json
│   └── connectRedis()
│
├── scrapeUrl(url, extractHint)          → Promise<ScrapeResult>
├── scrapeAndCache(source)               → Promise<void>
│
├── getSourcesByCron(cronLabel)          → Source[]
├── runGroup(cronLabel)                  → Promise<void>
│
├── Cron jobs (3)
│   ├── daily_midnight    0 0 * * *
│   ├── twice_daily       0 0,12 * * *
│   └── weekly            0 0 * * 0
│
├── warmCache()                          → Promise<void>   (runs on startup)
│
└── --force flag handler                 (CLI utility)
```

---

## Relationship to `webCache.js`

These two modules are complementary but independent:

| | `scraper.cron.js` | `webCache.js` |
|---|---|---|
| **Who calls it** | `node-cron` scheduler + startup | `callWebSearch()` in the graph |
| **When it runs** | On a schedule, proactively | On-demand, reactively |
| **Purpose** | Keep Redis warm before queries arrive | Serve cached content; scrape live on miss |
| **Shares** | Same `web_sources.json`, same Redis keys | Same `web_sources.json`, same Redis keys |

Both write to the same Redis keys — so a cron job running at midnight pre-populates the cache that `webCache.js` will serve to students during the day.

---

## `scrapeUrl(url, extractHint)`

```
scrapeUrl(url: string, extractHint: string) → Promise<ScrapeResult>
```

Low-level scraper. Fetches a URL, parses HTML with Cheerio, extracts readable text.

### Logic

```
axios.get(url, {
  timeout: SCRAPE_TIMEOUT_MS (env) or 10000ms,
  headers: {
    User-Agent: "Mozilla/5.0 (compatible; ParulCampusBot/1.0; ...)",
    Accept: "text/html,application/xhtml+xml",
    Accept-Language: "en-US,en;q=0.9"
  }
})
     │
     ▼
cheerio.load(response.data)

Remove noise elements:
  script, style, nav, footer, header, iframe,
  .cookie-banner, .popup

Try main content selectors (in order):
  main → article → .content → .page-content
  → #content → .entry-content → section
  ├── first element with content → text = el.text()
  └── all fail or text < 100 chars → text = $('body').text()

Clean text:
  replace /\s+/g → ' '
  replace /\n{3,}/g → '\n\n'
  trim
  slice(0, 8000)         ← cap at 8000 chars

return {
  success: true,
  url,
  extract_hint: extractHint,
  content: text,
  scraped_at: new Date().toISOString()
}
```

**On failure (network error, timeout, bad HTML):**
```js
return {
  success: false,
  url,
  content: null,
  error: err.message,
  scraped_at: new Date().toISOString()
}
```

**`extractHint`** is the `fetch_strategy.extract` string from `web_sources.json` (e.g. `"placement statistics, companies, packages"`). It is stored with the result for debugging/logging but is not used in the scraping logic itself. It could be used in a future LLM-guided extraction step.

---

## `scrapeAndCache(source)`

```
scrapeAndCache(source: Source) → Promise<void>
```

Orchestrates the scrape → Redis write flow for a single source.

### Logic

```
IF source.fetch_strategy.scrape === false:
  log: "Skipping [label] — scrape=false"
  return   (URL-only sources are never scraped by the cron)

scrapeUrl(source.url, source.fetch_strategy.extract) → result

IF result.success === false:
  redis.SET(
    "${source.redis.key}:error",
    JSON.stringify({ error, at }),
    { EX: 3600 }       ← error marker expires in 1 hour
  )
  return   (log warning)

payload = JSON.stringify(result)
ttlSeconds = source.redis.ttl_hours * 3600

redis.SET(source.redis.key, payload, { EX: ttlSeconds })
log: "✓ Cached [label] | TTL: [N]h | Key: [key]"
```

**Error marker key:** When a scrape fails, the cron writes `key:error` to Redis with a 1-hour TTL. This acts as a retry signal — if `webCache.js` checks the main key and gets a miss, a downstream admin dashboard could check `key:error` to know whether the miss is due to a failed scrape vs. a TTL expiry.

---

## `getSourcesByCron(cronLabel)`

```
getSourcesByCron(cronLabel: string) → Source[]
```

Filters `webSources.sources` by `source.redis.cron_label`. Returns all sources assigned to a given schedule group.

| `cronLabel` | Assigned source types |
|---|---|
| `daily_midnight` | Informational (about, awards, accreditation, research) |
| `twice_daily` | Dynamic (placements, admissions, careers, events) |
| `weekly` | Legal + external (privacy policy, Wikipedia, third-party) |

---

## `runGroup(cronLabel)`

```
runGroup(cronLabel: string) → Promise<void>
```

Scrapes all sources in a cron group in parallel using `Promise.allSettled()`.

### Logic

```
sources = getSourcesByCron(cronLabel)
log: "Running group: [label] ([N] sources)"

results = await Promise.allSettled(
  sources.map(src => scrapeAndCache(src))
)

passed = results.filter(r => r.status === 'fulfilled').length
failed = results.filter(r => r.status === 'rejected').length
log: "Group done — ✓ N passed, ✗ N failed"
```

`Promise.allSettled()` (not `Promise.all()`) — one failing scrape does not abort the group. All sources get a scrape attempt regardless of individual failures.

---

## Cron Jobs

All three jobs run in `Asia/Kolkata` timezone.

```
┌─────────────────┬──────────────┬────────────────────────────────────────────┐
│ Label           │ Cron         │ Runs at (IST)                              │
├─────────────────┼──────────────┼────────────────────────────────────────────┤
│ daily_midnight  │ 0 0 * * *    │ Every day at 12:00 AM                      │
│ twice_daily     │ 0 0,12 * * * │ Every day at 12:00 AM and 12:00 PM         │
│ weekly          │ 0 0 * * 0   │ Every Sunday at 12:00 AM                   │
└─────────────────┴──────────────┴────────────────────────────────────────────┘
```

Each job simply calls `runGroup(label)`. The cron definitions:

```js
cron.schedule('0 0 * * *',   () => runGroup('daily_midnight'), { timezone: 'Asia/Kolkata' });
cron.schedule('0 0,12 * * *', () => runGroup('twice_daily'),   { timezone: 'Asia/Kolkata' });
cron.schedule('0 0 * * 0',   () => runGroup('weekly'),         { timezone: 'Asia/Kolkata' });
```

---

## `warmCache()` — Startup Warm-Up

```
warmCache() → Promise<void>
```

Runs **once at process startup**, before cron jobs are scheduled. Ensures that the cache is populated immediately so the first student query after a cold start doesn't trigger a blocking live scrape.

### Logic

```
For each source in webSources.sources:
  skip IF source.fetch_strategy.scrape === false
  skip IF source.redis.key is falsy

  redis.EXISTS(source.redis.key) → 0 or 1
  IF 0 → add to missing[]

IF missing.length === 0:
  log: "All cache keys present. No warm-up needed."
  return

log: "[N] keys missing. Scraping now..."

await Promise.allSettled(
  missing.map(src => scrapeAndCache(src))
)

log: "Cache warm-up complete."
```

**When does warm-up fire?**
- First deploy (Redis is empty)
- After a Redis flush / restart
- After TTLs expired during a period of no traffic (e.g. overnight restart)

---

## `--force` Flag — Manual Scrape

Run from the command line to immediately scrape a specific source by its ID and overwrite the Redis cache.

```bash
node scraper.cron.js --force src_placements
```

### Logic

```
IF process.argv.includes('--force'):
  targetId = process.argv[indexOf('--force') + 1]
  source = webSources.sources.find(s => s.id === targetId)

  IF not found:
    log available IDs
    process.exit(1)

  scrapeAndCache(source)
  process.exit(0)
```

**When to use:**
- A page updated between scheduled runs (e.g. new placement stats published)
- Testing a new source entry in `web_sources.json`
- Clearing a bad scrape without waiting for TTL

---

## Process Lifecycle

```
node scraper.cron.js
         │
         ▼
    connectRedis()
         │
         ▼
    warmCache()              ← checks all keys, scrapes missing ones
         │
         ▼
    Register cron jobs       ← 3 jobs scheduled (do not run immediately)
         │
         ▼
    Process stays alive      ← node-cron keeps the event loop open
         │
    (every midnight)
         │
         ▼
    daily_midnight fires → runGroup → scrapeAndCache (per source)
         │
    (every noon & midnight)
         │
         ▼
    twice_daily fires   → runGroup → scrapeAndCache (per source)
         │
    (every Sunday midnight)
         │
         ▼
    weekly fires        → runGroup → scrapeAndCache (per source)
```

---

## Adding a New Source

1. Add an entry to `campus-data/web_sources.json`:

```json
{
  "id": "src_events",
  "label": "Events — Parul University",
  "url": "https://www.paruluniversity.ac.in/events/",
  "type": "official",
  "priority": 2,
  "intent_keywords": ["events", "fest", "cultural event", "seminar", "workshop"],
  "fetch_strategy": {
    "scrape": true,
    "extract": "upcoming events, dates, venues"
  },
  "redis": {
    "key": "web:events",
    "ttl_hours": 12,
    "cron_label": "twice_daily"
  }
}
```

2. The cron daemon picks it up automatically on next startup (warm-up will scrape it immediately if the key is missing).

3. Force a manual scrape to test: `node scraper.cron.js --force src_events`

**`type` values:**
- `"official"` — paruluniversity.ac.in domain. No disclosure appended.
- `"external"` — third-party sites (Wikipedia, Shiksha, etc.). Disclosure text is appended to the LLM response automatically.

**`scrape: false`** — for pages behind login or infinite scroll where scraping doesn't work. `webCache.js` will return only the URL, and `callWebSearch()` will show the student the link directly.
