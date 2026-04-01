# Dexa — Supporting Modules

> Covers the three modules that back the pipeline: the vector store and place bundle engine that answer queries from local campus data, the web cache layer that falls back to scraped content, and the scheduled scraping daemon that keeps that cache warm.
>
> **Files:** `services/v2/vectorStore.js` · `webCache.js` · `scraper.cron.js`

---

## Table of Contents

1. [How the Three Modules Relate](#1-how-the-three-modules-relate)
2. [Vector Store — `initializeStore()`](#2-vector-store--initializestore)
3. [Semantic Search — `searchCampusData()`](#3-semantic-search--searchcampusdata)
4. [Scoring Utilities](#4-scoring-utilities)
5. [Place Bundle Engine — `getCampusPlaceBundle()`](#5-place-bundle-engine--getcampusplacebundle)
6. [Result Bundle — `getRelevantPlaceBundleFromResults()`](#6-result-bundle--getrelevantplacebundlefromresults)
7. [Web Source Matching — `matchSource()`](#7-web-source-matching--matchsource)
8. [Redis Cache — `getFromCache()` & `fetchLive()`](#8-redis-cache--getfromcache--fetchlive)
9. [Web Answer Pipeline — `getWebAnswer()`](#9-web-answer-pipeline--getwebanswer)
10. [Cache Utilities — `invalidateCache()` & `getCacheStatus()`](#10-cache-utilities--invalidatecache--getcachestatus)
11. [Scraper — `scrapeUrl()` & `scrapeAndCache()`](#11-scraper--scrapeurl--scrapeandcache)
12. [Cron Jobs & Startup Warm-up](#12-cron-jobs--startup-warm-up)
13. [Data Flow Across All Three Modules](#13-data-flow-across-all-three-modules)

---

## 1. How the Three Modules Relate

```
campus-data/*.json ──► initializeStore() ──► MemoryVectorStore
                    └──► campusData{}        (in-memory)
                              │
                    searchCampusData()        ← called by Node 1 (graph)
                    getCampusPlaceBundle()    ← called by Node 1 (graph)
                    getRelevantPlaceBundleFromResults()  ← called by Node 1


web_sources.json ──► matchSource()
                          │
                    getFromCache()  →  Redis HIT  →  content
                          │
                    fetchLive()     →  scrape URL  →  cache  →  content
                          │
                    getWebAnswer()               ← called by Node 2 (graph)


scraper.cron.js ──► scrapeAndCache() ──► Redis  (proactive, on a schedule)
webCache.js     ──► fetchLive()      ──► Redis  (reactive, on cache miss)
                         ↑
                  same keys, same TTLs
```

`scraper.cron.js` and `webCache.js` share the same Redis key namespace defined in `web_sources.json`. The cron proactively fills the cache; `webCache.js` fills it reactively on a miss. Either way, once filled, subsequent queries are served from Redis.

---

## 2. Vector Store — `initializeStore()`

**File:** `services/v2/vectorStore.js`

```
initializeStore() → Promise<void>
```

Reads all JSON files from `/campus-data/`, serialises each record into a searchable text document, and indexes them into `MemoryVectorStore`. Must complete before any query can be handled.

### Module-level state (shared across all functions)

```js
let vectorStore;    // MemoryVectorStore instance — set by initializeStore()

const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2"  // local CPU inference, no API key
});

const campusData = {
  buildings: [],       // from buildings.json — used by place bundle engine
  departments: [],     // from departments.json
  services: [],        // from services.json
  paths: [],           // from paths.json → paths[]
  routeSummaries: []   // from paths.json → route_summaries[]
};
```

`campusData` is a separate in-memory cache for the place bundle engine, which needs random-access lookups (find by ID, filter by `building_id`) — operations the vector store doesn't support.

### Step-by-step

```
Files to process:
  buildings.json, departments.json, facilities.json, faculty.json,
  policies.json, paths.json, services.json, schedules.json

For each file:
  1. Check existence — skip with warning if missing
  2. JSON.parse

  3. Side-effects (populate campusData):
     buildings.json   → campusData.buildings
     departments.json → campusData.departments
     services.json    → campusData.services

  4a. paths.json (isPath: true) — special handling:
      campusData.paths         = rawData.paths
      campusData.routeSummaries = rawData.route_summaries
      For each path → create Document with natural language string:
        "Route from {from_name} to {to_name}. Distance: Xm. Time: Y min.
         Directions: {route_description}. Landmarks: {landmarks.join(", ")}"
      continue (skip standard handling)

  4b. All other files — standard handling:
      Extract array (Array.isArray check, then Object.values().find(Array.isArray))
      For each item → build searchableFields[] → join as pageContent
      Create Document({ pageContent, metadata: { ...item, category } })

After all files:
  vectorStore = new MemoryVectorStore(embeddings)
  Add documents in batches of 8:
    for i = 0 → allDocs.length, step 8:
      await vectorStore.addDocuments(allDocs.slice(i, i + 8))
  (batching prevents memory spikes with local CPU embeddings)
```

### Document serialisation — `formatValue()` + `searchableFields`

```
formatValue(value):
  null / undefined / ""  → ""
  string / number        → String(value)
  Array                  → each item formatted, joined with ", "
  Object                 → "key: value | key: value" (recursive)
```

Each non-path record becomes a flat text document:

```
Category: Department
Id: dept_cs
Name: Department of Computer Science & Engineering
Code: CS&E
Location: CV Raman Centre Floor 3
Room: 305
Contact: 02668-XXXXXX hod.cs@paruluniversity.ac.in
Description: ...
Aliases: CS dept, computer science
Keywords: engineering, programming
Programs: B.Tech CSE, M.Tech CSE
HOD: Dr. Example Name
```

Empty fields (ending in `": "`) are filtered out before joining to keep documents clean.

---

## 3. Semantic Search — `searchCampusData()`

**File:** `services/v2/vectorStore.js`

```
searchCampusData(query: string, limit: number = 2)
  → Promise<[[Document, score], ...]>
```

Runs cosine similarity search against the vector store. Returns `limit` results sorted by score descending. Throws if `initializeStore()` hasn't completed.

**Score range:** 0.0–1.0 (higher = more similar). The caller (`callLocalData`) checks `results[0][1]` against `VECTOR_SCORE_THRESHOLD` (0.55).

---

## 4. Scoring Utilities

**File:** `services/v2/vectorStore.js`

These helpers power the keyword-based place bundle engine (separate from the embedding-based vector search).

### `normalizeText(value)`

```
normalizeText(value: any) → string
Lowercase → strip non-alphanumeric (replace with space) → collapse whitespace → trim
```

Canonical comparison form used throughout all scoring functions.

---

### `includesNormalized(left, right)`

```
includesNormalized(left: any, right: any) → boolean
```

Bidirectional substring match on normalized values. Returns true if either contains the other. Used for loose name matching in route lookups and metadata cross-referencing.

---

### `scoreCandidate(query, values)`

```
scoreCandidate(query: string, values: string[]) → number
```

Keyword overlap scorer for direct entity matching (not embedding-based).

| Match type | Score |
|---|---|
| Exact full match | +10 |
| Query contains value | +6 |
| Value contains query | +5 |
| Token-level overlap | +1 per matching token |

Used by `findBuildingForQuery()` to rank buildings, departments, and services against the query.

---

### `getIntentAwareScore(query, metadata, building)`

```
getIntentAwareScore(query: string, metadata: object, building: object) → number
```

Applies bonus/penalty based on detected topic vs. matched entity type. Corrects cross-domain false matches that pure keyword scoring misses.

| Topic detected | Entity matches | Adjustment |
|---|---|---|
| Health keywords (fever, sick, doctor…) | medical/hospital/pharmacy | +10 |
| Health keywords | mess/canteen/temple | −6 |
| Food keywords (canteen, mess, eat…) | canteen/restaurant/dining | +10 |
| Food keywords | temple/hospital | −5 |
| Hostel keywords (hostel, warden…) | hostel/rector | +4 |

**Why this exists:** "Where is the health centre?" can lexically overlap with "food court" if both share enough tokens. The intent penalty ensures a mess building is not returned for a medical query.

---

### `queryHasAny(query, keywords)`

```
queryHasAny(query: string, keywords: string[]) → boolean
```

Returns true if the normalized query contains any of the normalized keywords. Used inside `getIntentAwareScore()` to detect health, food, and hostel topic signals.

---

## 5. Place Bundle Engine — `getCampusPlaceBundle()`

**File:** `services/v2/vectorStore.js`

```
getCampusPlaceBundle(query: string) → PlaceBundle | null
```

Keyword-based (not embedding-based) engine that finds the most relevant building for a query and assembles a rich structured location object. Called only when `LOCATION_INTENT_PATTERN` matches in `callLocalData`.

### `findBuildingForQuery(query)` — internal

```
findBuildingForQuery(query: string) → Building | undefined
```

Three-way scoring across buildings, departments, and services:

```
1. Score all buildings:
   scoreCandidate(query, [name, short_name, code, ...aliases])

2. Score all departments:
   scoreCandidate(query, [name, short_name, building_name, ...aliases])
   → resolve department.building_id → building

3. Score all services:
   scoreCandidate(query, [name, type, building_name, ...aliases])
   → resolve service.building_id → building

4. Merge all three lists
5. Filter: building must exist AND score > 0
6. Sort by score descending
7. Return candidates[0].building
```

This means "Where is the Computer Science department?" resolves to A25 (via the department record's `building_id`) even if "A25" or "CV Raman" weren't in the query.

### `getCampusPlaceBundle()` — full logic

```
1. findBuildingForQuery(query) → building | null → return null if null

2. related_departments = campusData.departments
     .filter(d => d.building_id === building.id)
     .slice(0, 5)
     .map(d => ({ name, floor, programs }))

3. routeSummary = (first match, in order):
   a. campusData.routeSummaries.find():
      label or summary includes building.name or building.code (normalized)
   b. campusData.paths.find():
      path.to === building.id AND from_name includes "main gate"
   c. null

4. Return PlaceBundle:
{
  type: "place_bundle",
  destination: {
    id, code, name, short_name, description,
    zone, floors,
    coordinates: { lat, lng, verified },
    nearby: [],
    aliases: []
  },
  route: {
    label, summary, distance_m, walk_minutes, landmarks
  } | null,
  related_departments: [{ name, floor, programs }]
}
```

---

## 6. Result Bundle — `getRelevantPlaceBundleFromResults()`

**File:** `services/v2/vectorStore.js`

```
getRelevantPlaceBundleFromResults(
  query: string,
  searchResults: [[Document, score], ...]
) → PlaceBundle | null
```

Builds a place bundle from vector search results rather than raw query text. Used for non-location queries where the LLM needs building metadata from the best-matching result.

### Difference from `getCampusPlaceBundle()`

| | `getCampusPlaceBundle()` | `getRelevantPlaceBundleFromResults()` |
|---|---|---|
| Input | Raw query string | Vector search results |
| Starting point | Keyword scoring across all entities | Metadata from top vector matches |
| Extra scoring | — | Intent-aware scoring on top of vector similarity |
| Called when | Location queries (LOCATION_INTENT_PATTERN) | All queries with a vector match |

### Step-by-step

```
For each [doc, similarity] in searchResults:
  1. findBuildingFromMetadata(doc.metadata) → building
     (see lookup chain below)
  2. Skip if building has no GPS (lat/lng)
  3. Compute:
     queryScore  = scoreCandidate(query, [metadata + building name fields])
     intentScore = getIntentAwareScore(query, metadata, building)

Sort candidates by:
  1st: (queryScore + intentScore) descending
  2nd: queryScore descending        (tiebreaker)
  3rd: similarity descending        (tiebreaker)

Take candidates[0] (best)
getCampusPlaceBundle(best.metadata.building_name || best.metadata.name || best.building.name)
  → bundle

Return {
  ...bundle,
  matched_entity: {
    id, name, category,
    building_id, building_name
  }
}
```

### `findBuildingFromMetadata(metadata)` — lookup chain

```
Tries in order, returns first match:
  1. buildings.find(b => b.id === metadata.id)
  2. buildings.find(b => b.code === metadata.code)
  3. buildings.find(b => b.id === metadata.building_id)
  4. buildings.find(b => b.name === metadata.building_name)
  5. buildings.find(b => includesNormalized(b.name, metadata.building_name))
  6. buildings.find(b => includesNormalized(b.name, metadata.name))
  7. null
```

---

## 7. Web Source Matching — `matchSource()`

**File:** `webCache.js`

```
matchSource(query: string) → Source | null
```

Finds the best matching entry in `web_sources.json` for a query using keyword overlap scoring.

### Algorithm

```
queryLower = query.toLowerCase()
queryWords = queryLower.split(/\s+/)

For each source in webSources.sources:
  score = 0

  For each keyword in source.intent_keywords:
    IF queryLower.includes(keyword.toLowerCase()):
      score += 3              ← exact phrase match
    ELSE:
      matchingWords = keywordWords ∩ queryWords
      score += matchingWords.length * 1   ← partial word match

  adjustedScore = score - (source.priority * 0.1)
  ← lower priority number = preferred, but only as a tiebreaker

  IF adjustedScore > bestScore:
    bestScore = adjustedScore
    bestSource = source

Return bestSource IF bestScore >= 2 ELSE null
```

**Minimum threshold of 2** prevents weak single-word coincidences from triggering a scrape. A query must match at least one full phrase (3 pts) or two separate words (1 pt each) to qualify.

### Worked example

Query: `"placement companies visiting campus"`

| Source | Phrases matched | Word matches | Raw | Priority | Adjusted |
|---|---|---|---|---|---|
| `src_placements` | "placement" (3), "companies" (1), "campus" (1) | — | 5 | 1 | 4.9 |
| `src_admissions` | — | "campus" (1) | 1 | 3 | 0.7 |

→ Returns `src_placements`

---

## 8. Redis Cache — `getFromCache()` & `fetchLive()`

**File:** `webCache.js`

### `getFromCache(source)`

```
getFromCache(source: Source) → Promise<CachedResult | null>
```

```
IF !source.redis.key OR source.redis.ttl_hours === 0:
  return null   (source not meant to be cached)

redis.get(source.redis.key)
  ├── null → cache MISS → return null
  └── string → JSON.parse → return CachedResult
```

Returns `null` on Redis errors (not throws) — caller falls through to `fetchLive()`.

---

### `fetchLive(source)`

```
fetchLive(source: Source) → Promise<ScrapedResult | null>
```

```
IF source.fetch_strategy.scrape === false:
  return { success: true, is_url_only: true, url, content: null, scraped_at }
  (URL-only sources — never scraped)

axios.get(url, { timeout: 10000, User-Agent: "ParulCampusBot" })
     │
cheerio.load(html)
  remove: script, style, nav, footer, header, iframe

  Try selectors in order:
    main → article → .content → .page-content → #content → .entry-content → section
    ├── first with content → text = el.text()
    └── all fail or < 100 chars → text = $('body').text()

  Clean: replace /\s+/ → ' ', trim, slice(0, 8000)

result = { success: true, url, content, scraped_at }

IF source.redis.key AND ttl_hours > 0:
  redis.SET(key, JSON.stringify(result), { EX: ttl_hours * 3600 })

return result
```

**8,000 char cap:** Keeps Redis values lean and avoids oversized LLM context.
**Returns `null` on failure:** Caller (`getWebAnswer`) returns `null` to the graph → `NOT_FOUND_PROMPT`.

---

## 9. Web Answer Pipeline — `getWebAnswer()`

**File:** `webCache.js`

```
getWebAnswer(query: string) → Promise<WebAnswer | null>
```

Main entry point called by `callWebSearch()` in the graph. Full four-step pipeline.

### Steps

```
Step 1: matchSource(query) → source | null
  └── null → return null

Step 2: source.fetch_strategy.scrape === false
  └── return { is_url_only: true, source_url, source_label, cached: false, disclosure }

Step 3: getFromCache(source) → hit | null
  └── hit → return { content, is_url_only: false, cached: true, scraped_at, disclosure }

Step 4: fetchLive(source) → result | null
  ├── null → return null
  └── success → return { content, is_url_only: false, cached: false, scraped_at, disclosure }
```

### `WebAnswer` shape

```js
{
  content: string | null,     // scraped text; null for URL-only
  source_url: string,
  source_label: string,
  is_url_only: boolean,
  cached: boolean,
  scraped_at: string | null,  // ISO timestamp
  disclosure: string | null   // third-party disclaimer, or null for official sources
}
```

### `disclosure` field

Set when `source.type === "external"` (Wikipedia, Shiksha, etc.):
> `"This information is from a third-party source and may not reflect the official university position."`

Passed to the LLM via `WEB_FALLBACK_SYSTEM_PROMPT`. The LLM appends it naturally to the response. `null` for official `paruluniversity.ac.in` sources.

### Decision tree

```
getWebAnswer(query)
      │
      matchSource(query)
      │
      ├── null ─────────────────────────────────────────► return null
      │                                                   → NOT_FOUND_PROMPT
      │
      └── source found
                │
                ├── scrape: false ────────────────────► return { is_url_only: true }
                │                                       → "Best place to check: [URL]"
                │
                ├── Redis HIT ───────────────────────► return { cached: true, content }
                │                                       → WEB_FALLBACK_SYSTEM_PROMPT
                │
                └── Redis MISS → fetchLive()
                          │
                          ├── null ─────────────────► return null → NOT_FOUND_PROMPT
                          │
                          └── success ──────────────► cache + return { cached: false }
                                                       → WEB_FALLBACK_SYSTEM_PROMPT
```

---

## 10. Cache Utilities — `invalidateCache()` & `getCacheStatus()`

**File:** `webCache.js`

### `invalidateCache(sourceId)`

```
invalidateCache(sourceId: string) → Promise<void>
```

Deletes a Redis key immediately. Use when a page updates before its TTL expires.

```
source = webSources.sources.find(s => s.id === sourceId)
  └── not found → log warning → return

redis.del(source.redis.key)
```

**When to call:** After a known page update (e.g. new placement stats published). Next query will trigger `fetchLive()` and re-cache.

---

### `getCacheStatus()`

```
getCacheStatus() → Promise<StatusEntry[]>
```

Returns cache hit/miss and TTL for all sources. Use for an admin dashboard or health-check endpoint.

```js
// StatusEntry shape
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

## 11. Scraper — `scrapeUrl()` & `scrapeAndCache()`

**File:** `scraper.cron.js`

### `scrapeUrl(url, extractHint)`

```
scrapeUrl(url: string, extractHint: string) → Promise<ScrapeResult>
```

Same core scraping logic as `fetchLive()` in `webCache.js`, with two additions:
- Uses a full browser-like `User-Agent` string with contact URL (improves access to protected pages)
- Stores `extract_hint` in the result for future LLM-guided extraction

```
axios.get(url, {
  timeout: process.env.SCRAPE_TIMEOUT_MS || 10000,
  headers: {
    User-Agent: "Mozilla/5.0 (compatible; ParulCampusBot/1.0; +https://paruluniversity.ac.in)"
    Accept-Language: "en-US,en;q=0.9"
  }
})
→ cheerio parse → remove noise → try content selectors → clean → slice(8000)
→ { success, url, extract_hint, content, scraped_at }

On failure → { success: false, url, content: null, error, scraped_at }
```

---

### `scrapeAndCache(source)`

```
scrapeAndCache(source: Source) → Promise<void>
```

```
IF source.fetch_strategy.scrape === false:
  log: "Skipping — scrape=false"
  return

result = await scrapeUrl(source.url, source.fetch_strategy.extract)

IF !result.success:
  redis.SET("${source.redis.key}:error",
    JSON.stringify({ error, at }),
    { EX: 3600 })     ← error marker expires in 1 hour
  return

redis.SET(source.redis.key, JSON.stringify(result), { EX: ttl_hours * 3600 })
```

**Error marker key (`key:error`):** Written on failed scrapes so an admin dashboard can distinguish a TTL-expiry miss (key absent, no error marker) from a failed-scrape miss (key absent, error marker present).

---

## 12. Cron Jobs & Startup Warm-up

**File:** `scraper.cron.js`

### Cron schedule

All jobs run in `Asia/Kolkata` timezone.

| Label | Cron | Time (IST) | Source types |
|---|---|---|---|
| `daily_midnight` | `0 0 * * *` | Every day 12:00 AM | Informational (about, awards, research) |
| `twice_daily` | `0 0,12 * * *` | 12:00 AM & 12:00 PM | Dynamic (placements, admissions, careers) |
| `weekly` | `0 0 * * 0` | Sunday 12:00 AM | Legal + external (privacy policy, Wikipedia) |

Each job calls `runGroup(label)`:

```
runGroup(cronLabel):
  sources = getSourcesByCron(cronLabel)
    → webSources.sources.filter(s => s.redis.cron_label === cronLabel)

  await Promise.allSettled(sources.map(src => scrapeAndCache(src)))
  ← allSettled: one failure does not abort the group
```

---

### `warmCache()` — startup warm-up

```
warmCache() → Promise<void>
```

Runs once at process start, before cron jobs are registered. Prevents cold-start cache misses on the first student query after a deploy or Redis restart.

```
For each source (scrape-enabled, has redis.key):
  redis.EXISTS(key) → 0 or 1
  IF 0 → add to missing[]

IF missing.length === 0:
  log: "All cache keys present"
  return

await Promise.allSettled(missing.map(src => scrapeAndCache(src)))
```

**Triggers on:** first deploy (Redis empty), Redis flush/restart, TTL expiry during downtime.

---

### `--force` flag — manual scrape

Force-scrape a single source by ID, bypassing the schedule. Overwrites the current Redis value immediately.

```bash
node scraper.cron.js --force src_placements
```

```
targetId = process.argv[indexOf('--force') + 1]
source = webSources.sources.find(s => s.id === targetId)
  └── not found → log available IDs → process.exit(1)

scrapeAndCache(source)
process.exit(0)
```

**When to use:** A page updated mid-schedule; testing a newly added source entry.

---

### Process lifecycle

```
node scraper.cron.js
        │
        connectRedis()
        │
        warmCache()          ← immediate: scrapes missing keys
        │
        register cron jobs   ← 3 jobs scheduled (not fired immediately)
        │
        process stays alive  ← node-cron holds the event loop open
        │
        [12:00 AM daily]  → daily_midnight fires → runGroup
        [12:00 PM daily]  → twice_daily fires    → runGroup
        [Sunday 12:00 AM] → weekly fires          → runGroup
```

---

## 13. Data Flow Across All Three Modules

```
SERVER STARTUP
──────────────

  initializeStore()
       │
       reads campus-data/*.json
       │
       ├──► campusData { buildings, departments, services, paths, routeSummaries }
       │         used by: getCampusPlaceBundle, getRelevantPlaceBundleFromResults,
       │                  findBuildingForQuery, findBuildingFromMetadata
       │
       └──► vectorStore (MemoryVectorStore)
                 used by: searchCampusData

  warmCache()
       │
       reads web_sources.json → missing Redis keys
       │
       scrapeAndCache(missing sources) → Redis


QUERY TIME (Node 1 — local_search)
───────────────────────────────────

  searchCampusData(query, 4)
       └──► vectorStore.similaritySearchWithScore
            → [[Document, score], ...]
            → bestScore checked against VECTOR_SCORE_THRESHOLD

  getCampusPlaceBundle(query)           [location queries only]
       └──► findBuildingForQuery
            └──► scoreCandidate across buildings, departments, services
            → building
            → routeSummaries / paths lookup
            → PlaceBundle

  getRelevantPlaceBundleFromResults(query, searchResults)
       └──► findBuildingFromMetadata (per result)
            └──► scoreCandidate + getIntentAwareScore
            → best candidate
            → getCampusPlaceBundle(best building name)
            → extended PlaceBundle with matched_entity


QUERY TIME (Node 2 — web_search)
─────────────────────────────────

  getWebAnswer(query)
       │
       matchSource(query)
       └──► keyword score across web_sources.json → source

       getFromCache(source)
       └──► redis.GET(key) → CachedResult | null

       fetchLive(source)                     [on cache miss]
       └──► axios + cheerio → text
            redis.SET(key, text, { EX: ttl })
            → ScrapedResult

       → WebAnswer { content, source_url, cached, disclosure }


BACKGROUND (scraper.cron.js)
─────────────────────────────

  scrapeAndCache(source)
       └──► scrapeUrl(url) → text
            redis.SET(key, text, { EX: ttl })

  Same Redis keys as webCache.js — cron fills proactively,
  webCache fills reactively on miss. Both honour the same TTLs
  defined in web_sources.json.
```

---

## Adding a New Web Source

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

2. Both `scraper.cron.js` and `webCache.js` pick it up automatically — no code changes needed.

3. Test immediately: `node scraper.cron.js --force src_events`

**`type` values:** `"official"` (no disclosure) · `"external"` (third-party disclaimer added to LLM response)

**`scrape: false`:** Use for login-gated or JS-rendered pages. `webCache.js` returns only the URL; `callWebSearch` shows the student the link directly.
