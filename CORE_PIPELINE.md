# Dexa — Core Pipeline

> Covers the full query lifecycle: how a message enters the system, how safety checks run, how the LangGraph graph routes it, and how the LLM is instructed to respond.
>
> **Files:** `routes/v2/chat.js` · `services/v2/ragPipeline.js` · `utils/guardrails.js` · `utils/prompts.js`

---

## Table of Contents

1. [End-to-End Request Flow](#1-end-to-end-request-flow)
2. [Route Handler — `chat.js`](#2-route-handler--chatjs)
3. [Entry Point — `runCampusBot()`](#3-entry-point--runcampusbot)
4. [Guardrail System — `applyGuardrails()`](#4-guardrail-system--applyguardrails)
5. [Query Classifier — `detectQueryType()`](#5-query-classifier--detectquerytype)
6. [LangGraph Workflow](#6-langgraph-workflow)
7. [Node 1 — `callLocalData()`](#7-node-1--calllocaldata)
8. [Node 2 — `callWebSearch()`](#8-node-2--callwebsearch)
9. [Prompt System — `prompts.js`](#9-prompt-system--promptsjs)
10. [Graph State & Memory](#10-graph-state--memory)
11. [Full Decision Tree](#11-full-decision-tree)

---

## 1. End-to-End Request Flow

```
POST /api/v2/chat
{ message, sessionId }
        │
        ▼
  chat.js route handler
  ├── validate: message present?
  └── threadId = sessionId || "temp_session_" + Date.now()
        │
        ▼
  runCampusBot(message, threadId)
        │
        ├─[applyGuardrails]──► short-circuit response  (no graph invoked)
        │
        └─[graph.invoke]
                │
        ┌───────┴────────────────────────────────────┐
        │           LangGraph Workflow                │
        │                                             │
        │   local_search (Node 1)                     │
        │     detectQueryType → buildSystemPrompt     │
        │     getCampusPlaceBundle (location only)    │
        │     searchCampusData (vector search)        │
        │     LLM call with campus context            │
        │          │                                  │
        │   ┌──────┴──────────┐                       │
        │ answer          NOT_FOUND_IN_DATA            │
        │   │                  │                      │
        │ END          web_search (Node 2)             │
        │               getWebAnswer(query)            │
        │               LLM call with web content      │
        │                    │                         │
        │                   END                        │
        └─────────────────────────────────────────────┘
                │
        result.messages[-1]
                │
        { response, metadata, query_type, source }
                │
        res.json({ success, sessionId, reply, data, queryType, source, timestamp })
```

---

## 2. Route Handler — `chat.js`

**File:** `routes/v2/chat.js`

Single route: `POST /api/v2/chat`

### Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `message` | string | Yes | Raw user query |
| `sessionId` | string | No | If omitted, a temporary ID is generated — conversation memory won't persist across requests |

### What it does

```
1. message missing → 400 { error: "What would you like to know..." }

2. threadId = sessionId || "temp_session_" + Date.now()
   (temp IDs are safe but memory won't persist if the client doesn't send a consistent ID)

3. runCampusBot(message, threadId) → result

4. 200 {
     success: true,
     sessionId: threadId,
     reply: result.response,
     data: result.metadata || null,
     queryType: result.query_type || null,
     source: result.source || null,
     timestamp: new Date().toISOString()
   }

5. Any thrown error → 500 {
     success: false,
     error: "I'm having trouble accessing the campus database..."
   }
```

### `source` field values

| Value | Meaning |
|---|---|
| `"local"` | Answered from vector store + campus JSON |
| `"web"` | Answered from scraped web content |
| `"web_url_only"` | Source has `scrape: false`; only a URL returned |
| `"not_found"` | Neither local nor web had an answer |
| `"guardrail"` | Intercepted before the graph ran |

---

## 3. Entry Point — `runCampusBot()`

**File:** `services/v2/ragPipeline.js`

```
runCampusBot(userMessage: string, threadId: string = "default")
  → Promise<{ response, metadata, query_type, source }>
```

The only public export meant for external callers. Wraps the graph with the guardrail check.

### Step-by-step

```
1. applyGuardrails(userMessage) → guardrail | null

2. IF guardrail (non-null):
   return {
     response: guardrail.response,
     metadata: {
       guardrail: true,
       tier: guardrail.tier,       // "blocked" | "sensitive" | "off_topic"
       id: guardrail.id,
       is_critical: guardrail.is_critical,
       source: "guardrail"
     }
   }
   ← graph is NEVER invoked

3. campusBot.invoke(
     { messages: [new HumanMessage(userMessage)] },
     { configurable: { thread_id: threadId } }
   ) → result

4. lastMessage = result.messages[result.messages.length - 1]

5. return {
     response:   lastMessage.content,
     metadata:   lastMessage.additional_kwargs?.metadata || null,
     query_type: lastMessage.additional_kwargs?.query_type || null,
     source:     lastMessage.additional_kwargs?.source || null
   }
```

---

## 4. Guardrail System — `applyGuardrails()`

**File:** `utils/guardrails.js`

```
applyGuardrails(query: string) → GuardrailResult | null
```

Runs **before** the graph. Three tiers evaluated in order — first match wins.

### `normalize(text)` — internal helper

Lowercase → strip non-word/non-space chars → collapse whitespace → trim.

All pattern matching runs on the normalized form. Prevents bypass via punctuation, mixed case, or extra spaces (e.g. `"H@ck the portal"`, `"IGNORE  previous  instructions"`).

---

### Evaluation order

```
normalize(query)
     │
     ▼
① BLOCKED_PATTERNS loop
     ├── match → return { tier:"blocked", id:"blocked_content", is_critical:false }
     └── no match ↓

② SENSITIVE_TOPICS loop (outer: topics, inner: topic.patterns)
     ├── match → return { tier:"sensitive", id, response, is_critical }
     └── no match ↓

③ OFF_TOPIC_PATTERNS loop
     ├── match → return { tier:"off_topic", id:"off_topic", is_critical:false }
     └── no match ↓

④ return null  ←  safe, proceed to graph
```

**Why this order?**
- Tier 1 before Tier 2: a self-harm framed as a medical question must hard-block, not trigger a helpline response.
- Tier 2 before Tier 3: "depression" could match an off-topic lifestyle pattern — the empathetic response must win.

---

### Tier 1 — Blocked (hard stop, no LLM call)

| Category | Example triggers |
|---|---|
| Harmful content | "how to make a bomb", "synthesize poison" |
| System attacks | "hack the parul server", "exploit the wifi" |
| Child safety | "child porn", "csam" |
| Terrorism | "terrorist", "terrorism" |
| Exam malpractice | "how to cheat in exam", "get fake degree" |
| Bulk data extraction | "give me all student data", "dump the database" |
| Prompt injection | "ignore previous instructions", "pretend you are", "jailbreak", "DAN mode" |
| System prompt extraction | "what are your instructions", "repeat your system prompt" |

**Response (all Tier 1):** `"I'm not able to help with that. If you have a campus-related question, I'm happy to assist."`

---

### Tier 2 — Sensitive (empathetic redirect)

Each topic object: `{ id, patterns: RegExp[], response: string, is_critical: boolean }`

| `id` | `is_critical` | Triggers | Directs to |
|---|---|---|---|
| `suicidal_ideation` | `true` | "want to die", "kill myself", "self harm" | iCall (9152987821), Vandrevala (1860-2662-345), Counselling A11 |
| `mental_health` | `false` | "depressed", "panic attack", "burned out" | Insights Centre A11 (Mon–Fri 9–5, Sat 9–1) |
| `ragging` | `true` | "being bullied by seniors", "harassed in hostel" | Anti-Ragging Helpline 1800-180-5522, Student Welfare C3 |
| `medical_emergency` | `true` | "bleeding", "unconscious", "chest pain" | Parul Sevashram Hospital E2 (24/7), campus security |
| `sexual_harassment` | `true` | "sexually harassed", "unwanted touch", "POSH act" | ICC, Student Welfare C3 |
| `financial_distress` | `false` | "can't afford fees", "scholarship not received" | Scholarship Section C1, Accounts C1 |

**`is_critical` flag** is passed back via `metadata` — the frontend can use it to render emergency UI (alert banners, highlighted numbers).

---

### Tier 3 — Off-topic (polite redirect)

Catches queries unrelated to Parul University campus:

- Coding tutorials / CS concepts
- General knowledge (capitals, inventions, currency)
- Entertainment (cricket, Bollywood, song lyrics)
- Finance (stocks, Bitcoin)
- Food/weather/recipes
- Personal relationship advice
- National politics (parties, elections)

**Response:** Politely redirects back to campus topics.

---

### `GuardrailResult` shape

```js
{
  tier: "blocked" | "sensitive" | "off_topic",
  id: string,           // e.g. "mental_health", "blocked_content"
  response: string,     // ready-to-send user-facing text
  is_critical: boolean  // true for life-safety situations
}
```

---

## 5. Query Classifier — `detectQueryType()`

**File:** `utils/guardrails.js`

```
detectQueryType(query: string)
  → "directions" | "location" | "person" | "service" | "policy" | "general"
```

Called by `callLocalData()`. Result is used to select the LLM format template in `buildSystemPrompt()`. Runs on normalized query. **First match wins** — order is intentional.

```
normalize(query)
     │
     ▼
① /how to reach|directions? to|route (to|from)|walk(ing)? (to|from)|from (main gate|gate|hostel)/
     └── "directions"

② /where is|location of|find|nearest|where (can i find|do i go)/
     └── "location"

③ /who is|hod|head of department|dean|professor|faculty|contact (of|for)|email (of|for)/
     └── "person"

④ /timing|timings|open|close|hours|when (does|is|are)|schedule|bus|canteen|mess|library/
     └── "service"

⑤ /rule|policy|attendance|backlog|atkt|fine|hostel rule|dress code|scholarship (rule|process)/
     └── "policy"

⑥ (no match)
     └── "general"
```

**Why `directions` before `location`?**
"How to reach the library" matches both. Since the student wants turn-by-turn guidance, `directions` gives the more useful `FORMAT_DIRECTIONS` template. Specificity wins.

---

## 6. LangGraph Workflow

**File:** `services/v2/ragPipeline.js`

### Graph State

```js
GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,  // appends each invocation's messages
    default: () => []
  })
})
```

Single array of LangChain messages. Both nodes read from and append to it. Persisted per `thread_id` by `MemorySaver`.

### Graph structure

```
Entry point ──► local_search (Node 1)
                     │
          ┌──────────┴──────────────┐
       answer              "NOT_FOUND_IN_DATA"
          │                         │
        END               web_search (Node 2)
                                    │
                                  END
```

Conditional edge logic (after `local_search`):

```js
(state) => {
  const last = state.messages[state.messages.length - 1];
  return last.content.trim() === "NOT_FOUND_IN_DATA" ? "web_search" : "__end__";
}
```

### Constants

**`VECTOR_SCORE_THRESHOLD = 0.55`**

`MemoryVectorStore.similaritySearchWithScore()` returns cosine **similarity** (higher = more similar, 0–1). Scores below 0.55 indicate no confident local match → route to web.

| Adjust | Effect |
|---|---|
| Lower threshold | More web fallbacks, fewer false-positive local answers |
| Higher threshold | More local answers, risk of weak/hallucinated matches |

**`LOCATION_INTENT_PATTERN`**

```js
/\b(where (is|are|can i find|do i go)|location (of|for)|find|how to (reach|get to|find)|directions? (to|for)|route (to|from)|nearest|which (block|building|floor)|take me to)\b/i
```

Guards `getCampusPlaceBundle()` — only called when the query has clear location-seeking language. Without this, keyword scoring would match a building for almost any query (e.g. "placement stats" → Placement Cell building) and incorrectly suppress web fallback.

---

## 7. Node 1 — `callLocalData()`

**Triggered by:** graph entry (`local_search`)

### Method signature (internal)

```
callLocalData(state: GraphState) → Promise<{ messages: AIMessage[] }>
```

### Step-by-step logic

```
1. lastUserMsg = state.messages[-1].content
2. queryType   = detectQueryType(lastUserMsg)
3. systemPrompt = buildSystemPrompt(queryType)
   └── CAMPUS_ASSISTANT_SYSTEM_PROMPT + FORMAT_[type] template (if applicable)

4. isLocationQuery = LOCATION_INTENT_PATTERN.test(lastUserMsg)
   ├── true  → placeBundle = getCampusPlaceBundle(lastUserMsg)
   └── false → placeBundle = null

5. searchResults = await searchCampusData(lastUserMsg, 4)
   bestScore = searchResults[0]?.[1] ?? 0

6. ── ROUTING DECISION ──
   IF !placeBundle AND bestScore < 0.55:
     return AIMessage("NOT_FOUND_IN_DATA")   → routes to web_search

7. resultBundle = getRelevantPlaceBundleFromResults(lastUserMsg, searchResults)

8. context = searchResults.map(([doc, score]) =>
     `Match N (score: X.XXX):\n${doc.pageContent}`
   ).join("\n\n")

9. bundleContext = (placeBundle)
   ? "Building: ... Zone: ... Route: ... Departments: ..."
   : ""

10. response = await llm.invoke([
      SystemMessage(systemPrompt),
      ...state.messages.slice(-3),       // last 3 msgs for conversation history
      HumanMessage([context, bundleContext, question].filter(Boolean).join("\n\n"))
    ])

11. IF response.content.trim() === "NOT_FOUND_IN_DATA":
      return AIMessage("NOT_FOUND_IN_DATA")   → routes to web_search

12. return AIMessage({
      content: response.content,
      additional_kwargs: {
        metadata: resultBundle | placeBundle | bestMatch.metadata | null,
        query_type: queryType,
        source: "local"
      }
    })
```

### Context structure sent to LLM

```
Campus Data:
Match 1 (score: 0.821):
Category: Department
Name: Department of Computer Science & Engineering
Location: CV Raman Centre Floor 3
...

Match 2 (score: 0.734):
...

Place Bundle:
Building: CV Raman Centre (A25)
Zone: north-central | Floors: 7
Coordinates: lat 22.xxx, lng 73.xxx
Route label: Main Gate to A25
Route summary: Head straight from Main Gate...
Walking distance: 620 metres | Walking time: 8 minutes
Departments inside: Dept. of CS&E (Floor 3), ...

Student Question: Where is the CS department?
```

---

## 8. Node 2 — `callWebSearch()`

**Triggered by:** conditional edge when `NOT_FOUND_IN_DATA` is signalled

### Method signature (internal)

```
callWebSearch(state: GraphState) → Promise<{ messages: AIMessage[] }>
```

### Why `length - 2`?

When Node 1 appends `AIMessage("NOT_FOUND_IN_DATA")`, the state looks like:

```
state.messages = [
  ...,
  HumanMessage("Where is the placement cell?"),   ← [-2] original query
  AIMessage("NOT_FOUND_IN_DATA")                  ← [-1] routing signal
]
```

Node 2 always reads `messages[length - 2]` to recover the original user question.

### Step-by-step logic

```
1. userQuery = state.messages[-2].content

2. webAnswer = await getWebAnswer(userQuery)

3. ── BRANCH A: webAnswer is null ──
   Nothing found anywhere.
   llm.invoke([NOT_FOUND_PROMPT, HumanMessage(userQuery)])
   return AIMessage({ source: "not_found", metadata: null })

4. ── BRANCH B: webAnswer.is_url_only === true ──
   Source is scrape-disabled — return just the URL.
   return AIMessage({
     content: "For this, the best place to check is: [label]\n[url]",
     additional_kwargs: { source: "web_url_only", metadata: { ... } }
   })

5. ── BRANCH C: scraped content available ──
   llm.invoke([
     WEB_FALLBACK_SYSTEM_PROMPT,
     HumanMessage([
       `Source: ${source_label}`,
       `URL: ${source_url}`,
       disclosure || "",
       `Content:\n${content}`,
       `Student Question: ${userQuery}`
     ].filter(Boolean).join("\n"))
   ])
   return AIMessage({ source: "web", metadata: { cached, scraped_at, ... } })
```

### Branch decision tree

```
getWebAnswer(userQuery)
       │
       ├── null ──────────────────────► NOT_FOUND_PROMPT → "I don't have details..."
       │
       ├── is_url_only: true ─────────► return URL directly → "Best place to check: [URL]"
       │
       └── content present
               ├── cached: true ──────► serve Redis content → LLM → answer
               └── cached: false ─────► live scrape → LLM → answer
```

---

## 9. Prompt System — `prompts.js`

**File:** `utils/prompts.js`

All LLM system prompts live here. Never written inline in graph nodes.

### Prompt inventory

| Export | Used in | Purpose |
|---|---|---|
| `CAMPUS_ASSISTANT_SYSTEM_PROMPT` | `callLocalData` | Main persona, data usage rules, `NOT_FOUND_IN_DATA` contract |
| `WEB_FALLBACK_SYSTEM_PROMPT` | `callWebSearch` (Branch C) | Answer from scraped content without exposing scraping mechanism |
| `NOT_FOUND_PROMPT` | `callWebSearch` (Branch A) | Empathetic no-answer with a concrete next step |
| `FORMAT_LOCATION` | `buildSystemPrompt("location")` | Structured card format (building code, zone, route, nearby) |
| `FORMAT_DIRECTIONS` | `buildSystemPrompt("directions")` | Natural sentence format with landmarks and walking time |
| `FORMAT_PERSON` | `buildSystemPrompt("person")` | 2–4 sentences: name, building, floor, contact |
| `FORMAT_SERVICE` | `buildSystemPrompt("service")` | 2–4 sentences: what, where, timings, rules |
| `FORMAT_POLICY` | `buildSystemPrompt("policy")` | Lead with key rule, consequence, exception, where to get help |

### How templates are injected

```js
// ragPipeline.js
function buildSystemPrompt(queryType) {
  const template = FORMAT_MAP[queryType];
  if (!template) return CAMPUS_ASSISTANT_SYSTEM_PROMPT;
  return `${CAMPUS_ASSISTANT_SYSTEM_PROMPT}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n${template}`;
}

const FORMAT_MAP = {
  location:   FORMAT_LOCATION,
  directions: FORMAT_DIRECTIONS,
  person:     FORMAT_PERSON,
  service:    FORMAT_SERVICE,
  policy:     FORMAT_POLICY,
  // "general" → not in map → base prompt returned unchanged
}
```

### `NOT_FOUND_IN_DATA` token contract

This token is the handoff signal between Node 1 and Node 2:

```
CAMPUS_ASSISTANT_SYSTEM_PROMPT instructs the LLM:
  "If data is insufficient → reply EXACTLY: NOT_FOUND_IN_DATA
   Do not wrap it. Do not apologise. Just the token."

callLocalData checks:
  response.content.trim() === "NOT_FOUND_IN_DATA"
  → return AIMessage("NOT_FOUND_IN_DATA")   [triggers conditional edge]
```

⚠ If the token string changes in `prompts.js`, the exact-match check in `ragPipeline.js` must be updated to match.

### Key prompt rules (enforced across all three main prompts)

| Rule | Applies to |
|---|---|
| Never mention `vector store`, `database`, `JSON`, `embeddings`, `cache`, `Redis` | All three |
| Never say "According to my data" or "Based on the information provided" | All three |
| Never start with "Sure!", "Great!", "Of course!" | All three |
| Never hallucinate room numbers, timings, names not in context | `CAMPUS_ASSISTANT_SYSTEM_PROMPT` |
| Never reveal scraping mechanism or URLs unless as a reference | `WEB_FALLBACK_SYSTEM_PROMPT` |
| Always provide a next step (office/phone/website) | `NOT_FOUND_PROMPT` |

---

## 10. Graph State & Memory

```js
const checkpointer = new MemorySaver();
export const campusBot = workflow.compile({ checkpointer });
```

- `MemorySaver` persists `GraphState` in memory, keyed by `thread_id`
- Each `campusBot.invoke()` with the same `thread_id` resumes the previous conversation
- **Context window management:** Node 1 only passes `state.messages.slice(-3)` to the LLM — the last 3 messages — to keep token usage bounded regardless of conversation length
- **Production note:** `MemorySaver` is in-process memory only. For multi-instance deployments, replace with a Redis-backed or database-backed checkpointer

---

## 11. Full Decision Tree

```
POST /api/v2/chat { message, sessionId }
         │
         validate: message present?
         │  NO → 400
         │
         ▼
runCampusBot(message, threadId)
         │
         applyGuardrails(message)
         │
         ├─ Tier 1 BLOCKED ────────────────────────────► { tier:"blocked", is_critical:false }
         │                                                 source: "guardrail"
         ├─ Tier 2 SENSITIVE (mental_health, ragging...)► { tier:"sensitive", is_critical:true/false }
         │                                                 source: "guardrail"
         ├─ Tier 3 OFF_TOPIC ──────────────────────────► { tier:"off_topic" }
         │                                                 source: "guardrail"
         │
         └─ null → graph.invoke
                       │
               ┌───────┴──────────────────────────────────────────────┐
               │               local_search (Node 1)                   │
               │                                                        │
               │  detectQueryType → buildSystemPrompt                   │
               │                                                        │
               │  LOCATION_INTENT_PATTERN matches?                      │
               │    YES → getCampusPlaceBundle() → placeBundle          │
               │    NO  → placeBundle = null                            │
               │                                                        │
               │  searchCampusData(query, 4) → bestScore                │
               │                                                        │
               │  placeBundle OR bestScore >= 0.55?                     │
               │    NO  → AIMessage("NOT_FOUND_IN_DATA") ──────────┐   │
               │    YES → LLM call with context                    │   │
               │               │                                   │   │
               │    LLM returns NOT_FOUND_IN_DATA? ─────YES────────┤   │
               │               │ NO                                │   │
               │    AIMessage(answer)                              │   │
               │    source: "local"  ──────────────────► END       │   │
               └───────────────────────────────────────────────────┼───┘
                                                                   │
                                                          web_search (Node 2)
                                                                   │
                                                    getWebAnswer(userQuery)
                                                                   │
                                         ┌──────────────┬──────────┴──────────┐
                                       null          url_only          content present
                                         │              │                     │
                                  NOT_FOUND_PROMPT   return URL        WEB_FALLBACK_PROMPT
                                  LLM → answer       directly          LLM → answer
                                  source:"not_found" source:"web_url"  source:"web"
                                         │              │                     │
                                         └──────────────┴──────────┬──────────┘
                                                                   END
                                                                    │
                                              { response, metadata, query_type, source }
                                                                    │
                                              res.json({ success, reply, data, ... })
```
