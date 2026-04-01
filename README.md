# Dexa — Parul University Smart Campus Assistant

> An AI-powered campus assistant for Parul University, Vadodara. Dexa answers student queries about locations, directions, departments, faculty, services, policies, and campus life — using a hybrid local vector search + web fallback pipeline built on LangGraph.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Query Pipeline — How It Works](#3-query-pipeline--how-it-works)
4. [Guardrail System](#4-guardrail-system)
5. [Vector Store & Embeddings](#5-vector-store--embeddings)
6. [Web Cache & Scraper](#6-web-cache--scraper)
7. [LLM & Prompt System](#7-llm--prompt-system)
8. [API Reference](#8-api-reference)
9. [Campus Data Schema](#9-campus-data-schema)
10. [Environment Variables](#10-environment-variables)
11. [Project Structure](#11-project-structure)

---

## 1. Project Overview

Dexa is a backend AI assistant that answers natural language queries from students, faculty, and visitors about the Parul University campus. It is designed to feel like a knowledgeable senior student — warm, confident, and never robotic.

**Core capabilities:**

- Answer location and direction queries with structured place bundles (building, floor, GPS, walking route)
- Answer queries about departments, faculty, services, schedules, hostel, and policies
- Fall back to live web scraping when local data doesn't have the answer
- Intercept harmful, off-topic, or sensitive queries before they reach the LLM
- Maintain per-session conversation memory via LangGraph's `MemorySaver`

**Tech stack:**

| Layer | Technology |
|---|---|
| AI Orchestration | LangGraph (`@langchain/langgraph`) |
| LLM | Groq — `llama-3.1-8b-instant` |
| Embeddings | HuggingFace Transformers (`Xenova/all-MiniLM-L6-v2`) — runs locally |
| Vector Store | LangChain `MemoryVectorStore` |
| Web Scraping | Axios + Cheerio |
| Cache | Redis |
| Scheduled Jobs | `node-cron` |
| Server | Express.js |

---

## 2. System Architecture

```
User Query
    │
    ▼
┌─────────────────────────────┐
│     POST /api/v2/chat        │  ← Express route
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│       applyGuardrails()      │  ← Pre-graph safety check
│  (guardrails.js)             │
└────────────┬────────────────┘
             │ null (safe) ──────────────────────────────────────► Guardrail response
             ▼
┌─────────────────────────────────────────────────────────┐
│                   LangGraph Workflow                      │
│                                                           │
│   ┌──────────────────────┐                               │
│   │  Node 1: local_search │                               │
│   │  - detectQueryType()  │                               │
│   │  - getCampusPlaceBundle() (location queries only)     │
│   │  - searchCampusData() (semantic vector search)        │
│   │  - LLM call with context                              │
│   └────────────┬─────────┘                               │
│                │                                          │
│     ┌──────────┴─────────────┐                           │
│     │                         │                          │
│  confident answer        NOT_FOUND_IN_DATA               │
│     │                         │                          │
│     ▼                         ▼                          │
│  __end__        ┌──────────────────────────┐             │
│                 │   Node 2: web_search      │             │
│                 │   - matchSource(query)    │             │
│                 │   - Redis cache check     │             │
│                 │   - Live scrape fallback  │             │
│                 │   - LLM call with content │             │
│                 └──────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
             │
             ▼
     Structured JSON response
     { reply, data, queryType, source, sessionId }
```

---

## 3. Query Pipeline — How It Works

### Step 1 — Guardrail check (pre-graph)

`applyGuardrails(userMessage)` runs before the LangGraph workflow. If it returns a non-null result, the graph is short-circuited and the guardrail response is returned directly. See [Section 4](#4-guardrail-system).

### Step 2 — Node 1: `local_search`

1. **`detectQueryType()`** classifies the query into one of: `location`, `directions`, `person`, `service`, `policy`, or `general`. This selects the matching format template from `prompts.js`.

2. **`getCampusPlaceBundle()`** is called only when the query contains a clear location intent (matched by `LOCATION_INTENT_PATTERN`). It scores buildings, departments, and services by keyword overlap and returns a structured bundle with GPS coordinates, zone, floor count, nearby buildings, and a walking route from the Main Gate.

3. **`searchCampusData()`** performs cosine similarity search against the in-memory vector store. Returns up to 4 results with scores.

4. **Routing decision:** If the best vector score is below `VECTOR_SCORE_THRESHOLD` (0.55) and no place bundle was matched, the node returns `NOT_FOUND_IN_DATA` to route to web search. Otherwise, it calls the LLM with the vector context and place bundle as structured campus data.

5. **LLM check:** If the LLM itself responds with exactly `NOT_FOUND_IN_DATA`, the node routes to web search rather than returning a hallucinated answer.

### Step 3 — Node 2: `web_search` (conditional)

Only runs when Node 1 signals `NOT_FOUND_IN_DATA`.

1. `matchSource(query)` finds the best matching entry in `web_sources.json` by keyword overlap scoring.
2. Redis is checked for a cached scrape result.
3. On cache miss, the URL is scraped live using Axios + Cheerio, cleaned, and cached with the source-defined TTL.
4. URL-only sources (marked `scrape: false`) return just the URL without any scraping.
5. The LLM is called with the scraped content using `WEB_FALLBACK_SYSTEM_PROMPT`.

### Step 4 — Response

The route handler returns:

```json
{
  "success": true,
  "sessionId": "thread_abc123",
  "reply": "The CV Raman Centre (A25) is in the north-central zone...",
  "data": { "type": "place_bundle", "destination": { ... } },
  "queryType": "location",
  "source": "local",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 4. Guardrail System

**File:** `utils/guardrails.js`

Three-tier system that intercepts queries before the LangGraph graph runs. Order of evaluation: Tier 1 → Tier 2 → Tier 3. First match wins.

### Tier 1 — Blocked (hard stop)

Matched by regex against the normalized query. No LLM call is made at all.

| Category | Examples |
|---|---|
| Harmful content | Instructions to make weapons, drugs, explosives |
| System hacking | Attempts to hack university portals, Wi-Fi, servers |
| Exam malpractice | How to cheat, fake marksheets or certificates |
| Personal data extraction | Requesting bulk student/faculty data or database dumps |
| Prompt injection | "Ignore previous instructions", jailbreak, DAN mode, "repeat your system prompt" |

**Response:** `"I'm not able to help with that. If you have a campus-related question, I'm happy to assist."`

### Tier 2 — Sensitive (empathetic redirect)

Matched topic-by-topic. Critical topics (`is_critical: true`) are checked before non-critical ones.

| Topic ID | Trigger examples | Response includes |
|---|---|---|
| `suicidal_ideation` | "want to die", "kill myself", "self harm" | iCall helpline, Vandrevala Foundation, on-campus counselling (A11) |
| `mental_health` | "depressed", "panic attack", "burned out" | Insights Centre for Counselling (A11) |
| `ragging` | "being bullied by seniors", "harassed in hostel" | National Anti-Ragging Helpline (1800-180-5522), Student Welfare Office (C3) |
| `medical_emergency` | "bleeding", "unconscious", "need ambulance" | Parul Sevashram Hospital E2 (24/7), campus security number |
| `sexual_harassment` | "sexually harassed", "unwanted touch", "POSH act" | ICC contact, Student Welfare Office (C3) |
| `financial_distress` | "can't afford fees", "scholarship not received" | Scholarship Section (C1), Accounts Section (C1) |

### Tier 3 — Off-topic (polite redirect)

Catches general knowledge, coding tutorials, personal advice, national politics, entertainment, weather, and similar queries unrelated to the university.

**Response:** Politely redirects the user back to campus-related topics.

### `detectQueryType(query)`

Also exported from `guardrails.js`. Classifies queries into one of six types used to select the LLM format template:

| Type | Trigger keywords |
|---|---|
| `directions` | "how to reach", "route to", "walking from" |
| `location` | "where is", "find", "nearest" |
| `person` | "who is", "HOD", "faculty", "contact of" |
| `service` | "timing", "open", "bus", "canteen", "library" |
| `policy` | "rule", "attendance", "backlog", "fine", "scholarship eligibility" |
| `general` | fallback for everything else |

---

## 5. Vector Store & Embeddings

**File:** `services/v2/vectorStore.js`

### Initialization

`initializeStore()` reads all JSON files from `/campus-data/` at startup, converts each record into a searchable text document, and indexes them into a `MemoryVectorStore`. Documents are added in batches of 8 to avoid memory spikes with local CPU embeddings.

**Files indexed:**

| File | Category |
|---|---|
| `buildings.json` | Building |
| `departments.json` | Department |
| `facilities.json` | Facility |
| `faculty.json` | Faculty |
| `policies.json` | Policy |
| `paths.json` | Navigation |
| `services.json` | Service |
| `schedules.json` | Schedule |

Each record is serialized into a flat text document containing all searchable fields (name, code, aliases, tags, location, contact, description, etc.). Path records receive special handling — they are formatted as a natural language route description.

**Embedding model:** `Xenova/all-MiniLM-L6-v2` — runs fully locally via HuggingFace Transformers. No external API call needed for embeddings.

### Place Bundle System

`getCampusPlaceBundle(query)` is a keyword-scoring engine (not a vector search) that returns a rich structured object for location queries. It scores across buildings, departments, and services, then assembles:

- Full building metadata (name, code, zone, floors, GPS coordinates, nearby buildings)
- Related departments inside the building (up to 5, with floor numbers)
- Best matching route from `routeSummaries` or `paths` (label, summary, distance, walking time, landmarks)

`getRelevantPlaceBundleFromResults(query, searchResults)` layers intent-aware scoring on top of vector search results. It applies bonus/penalty scores for health, food, and hostel keyword categories to resolve ambiguous matches (e.g. preventing "health" from matching a canteen building).

### Threshold Tuning

```js
const VECTOR_SCORE_THRESHOLD = 0.55;
```

`MemoryVectorStore.similaritySearchWithScore()` returns cosine **similarity** (higher = more similar, range 0–1). Queries scoring below 0.55 are routed to web search. Adjust this constant to tune sensitivity:

- **Lower the threshold** → more queries go to web search (fewer false positives)
- **Raise the threshold** → more queries are answered locally (risk of poor matches)

---

## 6. Web Cache & Scraper

### webCache.js

Agent-facing helper used by `callWebSearch()` in the graph.

**`matchSource(query)`**
Scores each source in `web_sources.json` by keyword overlap against the query. Uses phrase-match weight (3 points) and word-match weight (1 point per matching word), with a priority tiebreaker. Returns `null` if the best score is below 2.

**`getFromCache(source)`**
Checks Redis for a cached scrape result. Returns parsed JSON or `null` on miss.

**`fetchLive(source)`**
Scrapes the source URL using Axios + Cheerio. Removes noise elements (`script`, `style`, `nav`, `footer`, `header`, `iframe`). Tries main content selectors before falling back to `body`. Caps output at 8,000 characters. Stores result in Redis with the source's TTL. Returns `null` on fetch failure.

**`getWebAnswer(query)`**
Full pipeline in one call: `matchSource` → Redis check → live fetch fallback. Returns:

```js
{
  content,         // scraped text (null for URL-only sources)
  source_url,      // original URL
  source_label,    // human-readable source name
  is_url_only,     // true if scraping is disabled for this source
  cached,          // true if served from Redis
  scraped_at,      // ISO timestamp
  disclosure       // third-party disclaimer string (or null)
}
```

**`invalidateCache(sourceId)`**
Deletes a Redis key to force a fresh scrape on next query.

**`getCacheStatus()`**
Returns cache hit/miss status and TTL remaining for all sources. Useful for an admin health-check endpoint.

### scraper.cron.js

Scheduled scraping daemon. Reads `web_sources.json` and runs jobs on three schedules (IST):

| Schedule label | Cron | Sources |
|---|---|---|
| `daily_midnight` | `0 0 * * *` | Informational pages (about, awards, research) |
| `twice_daily` | `0 0,12 * * *` | Dynamic pages (placements, admissions, careers) |
| `weekly` | `0 0 * * 0` | Legal and external sources |

**Startup warm-up:** On server start, the scraper checks for missing Redis keys and immediately scrapes any stale or absent sources to avoid cold-start cache misses.

**Manual force-scrape:**
```bash
node scraper.cron.js --force src_placements
```
Replaces the cached content for a specific source ID immediately.

---

## 7. LLM & Prompt System

**File:** `utils/prompts.js`  
**Model:** `llama-3.1-8b-instant` via Groq API (`temperature: 0.1`)

All system prompts are defined in `prompts.js` and imported where needed. Prompts are never written inline in the graph.

### Prompts

| Export | Used in | Purpose |
|---|---|---|
| `CAMPUS_ASSISTANT_SYSTEM_PROMPT` | `callLocalData` | Main assistant persona. Instructs the LLM on tone, how to use structured campus data, partial data handling, and the `NOT_FOUND_IN_DATA` token rule. |
| `WEB_FALLBACK_SYSTEM_PROMPT` | `callWebSearch` | Instructs the LLM to answer from scraped web content without revealing the source mechanism. Includes disclosure rule for third-party sources. |
| `NOT_FOUND_PROMPT` | `callWebSearch` (no result) | Short empathetic response when neither local data nor web search finds anything. Always provides a next step (office, phone, website). |
| `FORMAT_LOCATION` | Appended to main prompt | Structured format for location query responses (building code, zone, route, nearby). |
| `FORMAT_DIRECTIONS` | Appended to main prompt | Natural sentence format for direction responses with landmarks and walking time. |
| `FORMAT_PERSON` | Appended to main prompt | 2–4 sentence format for faculty/staff queries. |
| `FORMAT_SERVICE` | Appended to main prompt | Format for service/facility queries (timings, rules, contact). |
| `FORMAT_POLICY` | Appended to main prompt | Lead with the key rule/number, consequence, exception, and where to get help. |

Format templates are injected at runtime by `buildSystemPrompt(queryType)` in `ragPipeline.js`, which appends the relevant template to `CAMPUS_ASSISTANT_SYSTEM_PROMPT` using a separator line.

---

## 8. API Reference

### `POST /api/v2/chat`

The single endpoint for all campus queries.

**Request body:**

```json
{
  "message": "Where is the Computer Science department?",
  "sessionId": "user_abc_session_1"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes | The user's natural language query |
| `sessionId` | string | No | Unique session ID for conversation memory. If omitted, a temporary ID is generated (not recommended for production) |

**Success response — `200 OK`:**

```json
{
  "success": true,
  "sessionId": "user_abc_session_1",
  "reply": "The Department of Computer Science is in CV Raman Centre (A25), 3rd floor...",
  "data": {
    "type": "place_bundle",
    "destination": {
      "id": "a25",
      "code": "A25",
      "name": "CV Raman Centre",
      "zone": "north-central",
      "floors": 7,
      "coordinates": { "lat": 22.123, "lng": 73.456, "verified": true },
      "nearby": ["A24", "A26"]
    },
    "route": {
      "label": "Main Gate to A25",
      "summary": "Head straight from Main Gate, past PU Circle...",
      "distance_m": 620,
      "walk_minutes": 8
    },
    "related_departments": [
      { "name": "Dept. of Computer Science", "floor": 3, "programs": ["B.Tech CSE", "M.Tech"] }
    ]
  },
  "queryType": "location",
  "source": "local",
  "timestamp": "2024-01-01T10:30:00.000Z"
}
```

**`source` field values:**

| Value | Meaning |
|---|---|
| `local` | Answered from vector store + campus JSON data |
| `web` | Answered from scraped web content |
| `web_url_only` | Source has `scrape: false`; only a URL was returned |
| `not_found` | Neither local nor web had the answer |
| `guardrail` | Intercepted before reaching the graph |

**`data` field:** Contains a `place_bundle` object for location queries, a web source metadata object for web-sourced answers, or `null` for policy/person/service queries.

**Error response — `400 Bad Request`:**

```json
{
  "error": "What would you like to know about the campus?"
}
```

**Error response — `500 Internal Server Error`:**

```json
{
  "success": false,
  "error": "I'm having trouble accessing the campus database right now. Please try again in a moment."
}
```

---

## 9. Campus Data Schema

All campus data lives in `/campus-data/` as JSON files. The vector store reads these at startup.

### `buildings.json` — `Building[]`

```json
{
  "id": "a25",
  "code": "A25",
  "name": "CV Raman Centre",
  "short_name": "CV Raman",
  "description": "Main science and engineering block",
  "zone": "north-central",
  "floors": 7,
  "lat": 22.123456,
  "lng": 73.456789,
  "coordinates_verified": true,
  "nearby": ["a24", "a26", "c1"],
  "aliases": ["CV Raman", "science block", "A25"]
}
```

### `departments.json` — `Department[]`

```json
{
  "id": "dept_cs",
  "name": "Department of Computer Science & Engineering",
  "short_name": "CS&E",
  "building_id": "a25",
  "building_name": "CV Raman Centre",
  "floor": 3,
  "room": "305",
  "hod": { "name": "Dr. Example Name", "email": "hod.cs@paruluniversity.ac.in", "phone": "02668-XXXXXX" },
  "programs": ["B.Tech CSE", "M.Tech CSE", "Ph.D"],
  "aliases": ["CS department", "computer science dept"]
}
```

### `faculty.json` — `Faculty[]`

```json
{
  "id": "fac_001",
  "name": "Dr. Example Faculty",
  "designation": "Associate Professor",
  "department_id": "dept_cs",
  "department_name": "Department of Computer Science & Engineering",
  "building_name": "CV Raman Centre",
  "floor": 3,
  "room": "308",
  "email": "example@paruluniversity.ac.in",
  "phone": "02668-XXXXXX",
  "subjects_taught": ["Data Structures", "Algorithms"],
  "aliases": ["Dr. Example"]
}
```

### `services.json` — `Service[]`

```json
{
  "id": "svc_library",
  "name": "Central Library",
  "type": "library",
  "building_id": "b3",
  "building_name": "Library Block",
  "floor": 0,
  "timings": "Mon–Sat: 8:00 AM – 10:00 PM",
  "contact_phone": "02668-XXXXXX",
  "contact_email": "library@paruluniversity.ac.in",
  "description": "Central library with 1 lakh+ books and digital resources",
  "rules": ["Valid ID card required", "No food or drinks inside"],
  "aliases": ["library", "central library", "B3"]
}
```

### `paths.json` — Navigation

```json
{
  "paths": [
    {
      "id": "path_gate_a25",
      "from": "main_gate",
      "from_name": "Main Gate",
      "to": "a25",
      "to_name": "CV Raman Centre",
      "distance_m": 620,
      "walk_minutes": 8,
      "route_description": "Head straight from Main Gate, pass PU Circle on your left...",
      "landmarks": ["PU Circle", "C1 Admin Block", "Watcher's Park"]
    }
  ],
  "route_summaries": [
    {
      "label": "Main Gate to CV Raman Centre",
      "summary": "8-minute walk heading north from Main Gate",
      "total_distance_m": 620,
      "total_walk_minutes": 8,
      "landmarks": ["PU Circle", "C1 Admin Block"]
    }
  ]
}
```

### `policies.json` — `Policy[]`

```json
{
  "id": "pol_attendance",
  "name": "Attendance Policy",
  "category": "academic",
  "content": "A minimum of 75% attendance is mandatory in each subject...",
  "rules": ["Below 75% results in detention", "Condonation up to 65% for medical reasons"],
  "tags": ["attendance", "75%", "detention", "condonation"]
}
```

### `web_sources.json` — Web Fallback Sources

```json
{
  "sources": [
    {
      "id": "src_placements",
      "label": "Placements — Parul University",
      "url": "https://www.paruluniversity.ac.in/placements/",
      "type": "official",
      "priority": 1,
      "intent_keywords": ["placement", "campus recruitment", "job", "company visits", "salary package"],
      "fetch_strategy": {
        "scrape": true,
        "extract": "placement statistics, companies, packages"
      },
      "redis": {
        "key": "web:placements",
        "ttl_hours": 12,
        "cron_label": "twice_daily"
      }
    }
  ]
}
```

**`type` values:** `official` (paruluniversity.ac.in pages) | `external` (Wikipedia, Shiksha, etc. — triggers third-party disclosure)

**`fetch_strategy.scrape`:** Set to `false` for sources that should only return a URL (e.g. admission portals, login-gated pages).

---

## 10. Environment Variables

Create a `.env` file in the project root:

```env
# LLM
GROQ_API_KEY=your_groq_api_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Scraper
SCRAPE_TIMEOUT_MS=10000

# Server
PORT=5000
```

---

## 11. Project Structure

```
/
├── server.js                        # Express app entry point, startup sequence
│
├── routes/
│   └── v2/
│       └── chat.js                  # POST /api/v2/chat
│
├── services/
│   └── v2/
│       ├── ragPipeline.js           # LangGraph workflow, runCampusBot()
│       └── vectorStore.js           # MemoryVectorStore, place bundle engine
│
├── utils/
│   ├── guardrails.js                # Three-tier safety layer, detectQueryType()
│   └── prompts.js                   # All LLM system prompts and format templates
│
├── webCache.js                      # Agent web fallback: match → Redis → live scrape
├── scraper.cron.js                  # Scheduled scraping daemon with warm-up
│
├── config/
│   └── redis.js                     # Redis client and connectRedis()
│
├── campus-data/
│   ├── buildings.json
│   ├── departments.json
│   ├── faculty.json
│   ├── facilities.json
│   ├── services.json
│   ├── policies.json
│   ├── paths.json
│   ├── schedules.json
│   └── web_sources.json             # Web scraping source config
│
└── .env
```

---

*Dexa — Parul University Smart Campus Assistant*
