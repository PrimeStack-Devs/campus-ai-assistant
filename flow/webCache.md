# `webCache.js` — Web Fallback Layer

**Location:** `webCache.js`  
**Role:** Agent-facing helper used by `callWebSearch()` in the graph. Matches user queries to known web sources, serves cached content from Redis, and falls back to live scraping when the cache is cold.

---

## Module Map

```
webCache.js
│
├── Module-level state
│   └── webSources (loaded once from campus-data/web_sources.json)
│
├── getRedis()                               → Promise<RedisClient>
│
├── matchSource(query)                       → Source | null
├── getFromCache(source)                     → Promise<CachedResult | null>
├── fetchLive(source)                        → Promise<ScrapedResult | null>
├── getWebAnswer(query)                      → Promise<WebAnswer | null>
│
├── invalidateCache(sourceId)                → Promise<void>
└── getCacheStatus()                         → Promise<StatusEntry[]>
```

---

## Module-level State

```js
const webSources = JSON.parse(
  readFileSync('campus-data/web_sources.json', 'utf-8')
);
```

Loaded synchronously at module initialisation. `web_sources.json` defines every scrapeable URL, its intent keywords, Redis key, TTL, and cron schedule. No file I/O happens at query time.

---

## `getRedis()`

```
getRedis() → Promise<RedisClient>
```

Internal helper. Calls `connectRedis()` (idempotent — safe to call multiple times) and returns the shared Redis client. Used by `getFromCache()`, `fetchLive()`, `invalidateCache()`, and `getCacheStatus()`.

---

## `matchSource(query)`

```
matchSource(query: string) → Source | null
```

Finds the best matching entry in `web_sources.json` for the user's query using keyword overlap scoring.

### Scoring algorithm

```
queryLower  = query.toLowerCase()
queryWords  = queryLower.split(/\s+/)

For each source in webSources.sources:
  score = 0

  For each keyword in source.intent_keywords:
    keywordLower = keyword.toLowerCase()

    IF queryLower.includes(keywordLower):      score += 3   (exact phrase match)
    ELSE:
      matches = keywordWords that appear in queryWords
      score  += matches.length * 1              (partial word match)

  adjustedScore = score - (source.priority * 0.1)   (tiebreaker: lower priority number = preferred)

  IF adjustedScore > bestScore:
    bestScore  = adjustedScore
    bestSource = source

Return bestSource IF bestScore >= 2 ELSE null
```

**Minimum threshold of 2:** Prevents weak single-word coincidental matches from triggering a scrape. A query must match at least one full phrase (score 3) or two separate keywords (score 2) to be considered a valid source match.

**Priority tiebreaker:** `source.priority` is an integer (1 = most specific/relevant). Subtracting `priority * 0.1` means that when two sources tie on keyword score, the one with priority 1 wins over priority 2. The 0.1 multiplier keeps tiebreaker influence small enough not to override a genuine score difference.

### Example

Query: `"placement companies visiting campus"`

| Source | Keywords matched | Raw score | Priority | Adjusted |
|---|---|---|---|---|
| `src_placements` | "placement" (3), "companies" (1), "campus" (1) | 5 | 1 | 4.9 |
| `src_admissions` | "campus" (1) | 1 | 3 | 0.7 |

→ Returns `src_placements`

---

## `getFromCache(source)`

```
getFromCache(source: Source) → Promise<CachedResult | null>
```

Checks Redis for a cached scrape result.

### Logic

```
IF source.redis.key is falsy OR source.redis.ttl_hours === 0:
  return null   (this source is not meant to be cached)

redis.get(source.redis.key) → raw string | null
  ├── null → cache MISS → return null
  └── string → JSON.parse → return CachedResult
```

**Returns `null` (not throws) on Redis errors** — the caller (`getWebAnswer`) will fall through to `fetchLive()`, degrading gracefully.

---

## `fetchLive(source)`

```
fetchLive(source: Source) → Promise<ScrapedResult | null>
```

Scrapes the source URL live and caches the result.

### Logic

```
IF source.fetch_strategy.scrape === false:
  return { success: true, url, content: null, is_url_only: true, scraped_at }
  (URL-only sources — never scraped, caller will return the URL directly)

axios.get(url, { timeout: 10000, headers: { User-Agent: ParulCampusBot } })
     │
     ▼
cheerio.load(response.data)
  remove: script, style, nav, footer, header, iframe

  Try main content selectors in order:
    main → article → .content → .page-content → #content → .entry-content → section
    ├── first match with content → use it
    └── all fail or < 100 chars → fallback to $('body').text()

  Clean: replace /\s+/ → ' ', trim, slice(0, 8000)

result = { success: true, url, content, scraped_at }

IF source.redis.key AND source.redis.ttl_hours > 0:
  redis.set(key, JSON.stringify(result), { EX: ttl_hours * 3600 })

return result
```

**8000 character cap:** Keeps Redis values lean and prevents oversized payloads being sent to the LLM context window.

**Returns `null` on network/parse failure** — `getWebAnswer()` returns `null` to the graph, which then calls the `NOT_FOUND_PROMPT` LLM chain.

---

## `getWebAnswer(query)`

```
getWebAnswer(query: string) → Promise<WebAnswer | null>
```

**Main entry point.** Called by `callWebSearch()` in the graph. Full pipeline in one call.

### Logic

```
Step 1: matchSource(query) → source | null
  └── null → log "No matching web source" → return null

Step 2: source.fetch_strategy.scrape === false
  └── return {
        content: null,
        source_url: source.url,
        source_label: source.label,
        is_url_only: true,
        cached: false,
        disclosure: third-party disclaimer if source.type === "external"
      }
  (no cache check, no scrape — just the URL)

Step 3: getFromCache(source) → cachedResult | null
  └── hit → return {
        content: cachedResult.content,
        source_url, source_label,
        is_url_only: false,
        cached: true,
        scraped_at: cachedResult.scraped_at,
        disclosure
      }

Step 4: fetchLive(source) → liveResult | null
  └── null → return null   (scrape failed)
  └── success → return {
        content: liveResult.content,
        source_url, source_label,
        is_url_only: false,
        cached: false,
        scraped_at: liveResult.scraped_at,
        disclosure
      }
```

### WebAnswer shape

```js
{
  content: string | null,          // scraped text, or null for URL-only
  source_url: string,              // original URL
  source_label: string,            // human-readable source name
  is_url_only: boolean,            // true when scraping is disabled
  cached: boolean,                 // true when served from Redis
  scraped_at: string | null,       // ISO timestamp of when content was scraped
  disclosure: string | null        // third-party disclaimer, or null for official sources
}
```

### `disclosure` field

Set when `source.type === "external"` (e.g. Wikipedia, Shiksha, CollegeDunia). Value:
> `"This information is from a third-party source and may not reflect the official university position."`

`callWebSearch()` passes this to the LLM prompt and the LLM is instructed to append it naturally to the response. Official sources (`source.type === "official"`) have `disclosure: null`.

---

## `invalidateCache(sourceId)`

```
invalidateCache(sourceId: string) → Promise<void>
```

Deletes a Redis key to force a fresh scrape on the next query. Use when you know a page has updated and don't want to wait for TTL expiry.

```
find source by id in webSources.sources
  └── not found → log warning → return

redis.del(source.redis.key)
log: "Cache invalidated: [key]"
```

---

## `getCacheStatus()`

```
getCacheStatus() → Promise<StatusEntry[]>
```

Returns hit/miss status and remaining TTL for all sources. Intended for an admin health-check endpoint.

### StatusEntry shape

```js
{
  id: "src_placements",
  label: "Placements — Parul University",
  key: "web:placements",
  cached: true,
  ttl_remaining_seconds: 38400,
  ttl_remaining_hours: "10.7",
  scrape_enabled: true,
  cron: "twice_daily"
}
```

---

## Full Pipeline Decision Tree

```
getWebAnswer(query)
      │
      ▼
matchSource(query)
      │
      ├── null (score < 2)
      │         └──► return null
      │                  ↓
      │             callWebSearch → NOT_FOUND_PROMPT → "I don't have this info..."
      │
      └── source matched
                │
                ├── source.fetch_strategy.scrape === false
                │         └──► return { is_url_only: true, source_url }
                │                  ↓
                │             callWebSearch → "Best place to check: [URL]"
                │
                ├── getFromCache(source) → hit
                │         └──► return { content, cached: true }
                │                  ↓
                │             callWebSearch → LLM with WEB_FALLBACK_SYSTEM_PROMPT
                │
                └── cache miss → fetchLive(source)
                          │
                          ├── null (scrape failed)
                          │         └──► return null → NOT_FOUND_PROMPT
                          │
                          └── success
                                    └──► cache result in Redis
                                         return { content, cached: false }
                                              ↓
                                         LLM with WEB_FALLBACK_SYSTEM_PROMPT
```

---

## Data Flow with Redis

```
web_sources.json
      │ loaded once at module init
      ▼
matchSource(query) ──► source object

source.redis.key = "web:placements"
source.redis.ttl_hours = 12

getFromCache()  ──► redis.GET("web:placements")
                          │
                    hit ──┤── parse JSON → return CachedResult
                          │
                    miss ──► fetchLive()
                                  │
                                  scrape URL
                                  │
                                  redis.SET("web:placements", JSON, { EX: 43200 })
                                  │
                                  return ScrapedResult
```
