# `ragPipeline.js` — LangGraph Workflow & Entry Point

**Location:** `services/v2/ragPipeline.js`  
**Role:** Orchestrates the full query lifecycle — from receiving a user message to returning a structured response. Defines the two-node LangGraph workflow and the guardrail-aware public entry point.

---

## Module Map

```
ragPipeline.js
│
├── Constants
│   ├── VECTOR_SCORE_THRESHOLD (0.55)
│   └── LOCATION_INTENT_PATTERN (regex)
│
├── buildSystemPrompt(queryType)        → string
│
├── LangGraph Nodes
│   ├── callLocalData(state)            → { messages }
│   └── callWebSearch(state)            → { messages }
│
├── Graph Definition
│   └── workflow (StateGraph)
│       ├── local_search  → callLocalData
│       ├── web_search    → callWebSearch
│       └── conditional edge: NOT_FOUND_IN_DATA → web_search | __end__
│
├── campusBot (compiled graph with MemorySaver checkpointer)
│
└── runCampusBot(userMessage, threadId) → { response, metadata, query_type, source }
```

---

## Constants

### `VECTOR_SCORE_THRESHOLD = 0.55`

Controls the cutoff for trusting local vector search results.

`MemoryVectorStore.similaritySearchWithScore()` returns **cosine similarity** — higher is better (range 0.0–1.0).

| Score | Meaning |
|---|---|
| ≥ 0.55 | Confident local match → answer from campus data |
| < 0.55 | Poor local match → route to web search |

**Tuning guide:**
- Lower → fewer false positives, more web fallbacks
- Higher → more local answers, risk of hallucination on weak matches

---

### `LOCATION_INTENT_PATTERN`

```js
/\b(where (is|are|can i find|do i go)|location (of|for)|find|how to (reach|get to|find)|directions? (to|for)|route (to|from)|nearest|which (block|building|floor)|take me to)\b/i
```

**Purpose:** Guards `getCampusPlaceBundle()`. Only called when the query contains a clear location-seeking phrase.

**Why this matters:** Without this guard, keyword scoring inside `getCampusPlaceBundle()` would match a building for almost any query (e.g. "placement stats" → matches Placement Cell building → incorrectly suppresses web search fallback).

---

## `buildSystemPrompt(queryType)`

```
buildSystemPrompt(queryType: string) → string
```

Selects the matching format template from `FORMAT_MAP` and appends it to `CAMPUS_ASSISTANT_SYSTEM_PROMPT` with a separator.

```
FORMAT_MAP = {
  location   → FORMAT_LOCATION
  directions → FORMAT_DIRECTIONS
  person     → FORMAT_PERSON
  service    → FORMAT_SERVICE
  policy     → FORMAT_POLICY
}
```

If `queryType` is `"general"` or unrecognised, returns the base system prompt without any format template appended.

---

## Graph State

```js
GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,   // appends incoming messages to existing array
    default: () => []
  })
})
```

The graph state is a single array of LangChain messages. Both nodes read from and write to this array. The checkpointer (`MemorySaver`) persists this state per `thread_id`, enabling multi-turn conversation memory.

---

## Node 1 — `callLocalData(state)`

**Triggered by:** graph entry point (`local_search`)

### Step-by-step logic

```
1. Extract last user message from state.messages
2. detectQueryType(lastUserMsg)          → queryType
3. buildSystemPrompt(queryType)          → systemPrompt

4. Test LOCATION_INTENT_PATTERN on query
   ├── match  → getCampusPlaceBundle(query)   → placeBundle (or null)
   └── no match → placeBundle = null
       └── log: "Skipping place bundle — not a location query"

5. searchCampusData(lastUserMsg, 4)      → searchResults [[doc, score], ...]
   ├── bestScore = searchResults[0]?.[1] ?? 0
   └── bestMatch = searchResults[0]?.[0]

6. ROUTING DECISION
   ├── placeBundle exists  → proceed to LLM
   ├── bestScore >= 0.55   → proceed to LLM
   └── neither             → return AIMessage("NOT_FOUND_IN_DATA")
                              → graph routes to web_search node

7. Build context string from searchResults (score + pageContent per result)
8. Build bundleContext string from placeBundle (if exists)

9. LLM call:
   SystemMessage(systemPrompt)
   + last 3 messages from state (conversation history)
   + HumanMessage([campusDataContext, bundleContext, question].join("\n\n"))

10. Check LLM response:
    ├── response.content.trim() === "NOT_FOUND_IN_DATA"
    │     → return AIMessage("NOT_FOUND_IN_DATA")   [routes to web_search]
    └── otherwise
          → return AIMessage with content + additional_kwargs:
              { metadata: resultBundle | placeBundle | bestMatch.metadata,
                query_type: queryType,
                source: "local" }
```

### Context passed to LLM

```
Campus Data:
  Match 1 (score: 0.821):
  Category: Department
  Name: Department of Computer Science
  ...

Place Bundle:
  Building: CV Raman Centre (A25)
  Zone: north-central
  Floors: 7
  ...

Student Question: Where is the CS department?
```

### Return shape

```js
{
  messages: [
    new AIMessage({
      content: "The CS department is in A25...",
      additional_kwargs: {
        metadata: { /* place bundle or match metadata */ },
        query_type: "location",
        source: "local"
      }
    })
  ]
}
```

---

## Node 2 — `callWebSearch(state)`

**Triggered by:** conditional edge when last message content is `"NOT_FOUND_IN_DATA"`

### Step-by-step logic

```
1. userQuery = state.messages[length - 2].content
   (length - 1 is the NOT_FOUND signal, length - 2 is the original user question)

2. getWebAnswer(userQuery) → webAnswer (or null)

3. BRANCH A — webAnswer is null (nothing found anywhere):
   LLM call with NOT_FOUND_PROMPT + userQuery
   → AIMessage { source: "not_found", metadata: null }

4. BRANCH B — webAnswer.is_url_only === true:
   → AIMessage with direct link text
     { source: "web_url_only", metadata: { type: "web_source", is_url_only: true, ... } }

5. BRANCH C — scraped content available:
   LLM call with WEB_FALLBACK_SYSTEM_PROMPT + [source, url, disclosure, content, question]
   → AIMessage { source: "web", metadata: { type: "web_source", cached, scraped_at, ... } }
```

### Why `length - 2`?

When Node 1 returns `NOT_FOUND_IN_DATA`, it appends an `AIMessage("NOT_FOUND_IN_DATA")` to state. So at the time Node 2 runs:

```
state.messages = [
  ...,
  HumanMessage("Where is the placement cell?"),   ← index length - 2
  AIMessage("NOT_FOUND_IN_DATA")                  ← index length - 1
]
```

Node 2 always reads `length - 2` to get the original user query.

---

## Graph Definition & Routing

```
Entry: local_search (callLocalData)

Conditional edge from local_search:
  IF last message content === "NOT_FOUND_IN_DATA" → web_search
  ELSE                                             → __end__

Edge: web_search → __end__
```

### Decision tree

```
User query enters local_search
         │
         ├── Has location intent + place bundle found?
         │         └── YES → build context → LLM → response ──────────────► END
         │
         ├── Vector score >= 0.55?
         │         └── YES → build context → LLM
         │                        │
         │                        ├── LLM returns NOT_FOUND_IN_DATA → web_search
         │                        └── LLM returns answer ────────────────► END
         │
         └── Neither condition met → NOT_FOUND_IN_DATA → web_search
                                              │
                                              ├── web source matched + content found
                                              │         └── LLM with web content ──► END
                                              │
                                              ├── URL-only source
                                              │         └── return URL directly ──► END
                                              │
                                              └── nothing found
                                                        └── LLM with NOT_FOUND_PROMPT → END
```

---

## `runCampusBot(userMessage, threadId)`

**Public entry point.** Called by the route handler. Applies guardrails before invoking the graph.

```
runCampusBot(userMessage: string, threadId: string = "default")
  → Promise<{ response, metadata, query_type, source }>
```

### Logic

```
1. applyGuardrails(userMessage) → guardrail (or null)

2. IF guardrail:
   return {
     response: guardrail.response,
     metadata: {
       guardrail: true,
       tier: guardrail.tier,
       id: guardrail.id,
       is_critical: guardrail.is_critical,
       source: "guardrail"
     }
   }
   (graph is never invoked)

3. ELSE:
   campusBot.invoke(
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

### Session / memory behaviour

- `MemorySaver` checkpointer persists `GraphState` keyed by `thread_id`
- Each call to `campusBot.invoke()` with the same `thread_id` resumes the conversation from where it left off
- The node only sends the last 3 messages as history to the LLM (`state.messages.slice(-3)`) to keep context window usage bounded

---

## Data Flow Summary

```
runCampusBot(msg, threadId)
      │
      ├─[guardrails]──► short-circuit response (no graph)
      │
      └─[graph invoke]──► GraphState { messages: [HumanMessage(msg)] }
                                │
                         local_search node
                                │
                    ┌───────────┴───────────┐
              [found]                  [not found]
                 │                          │
          AIMessage(answer)          AIMessage("NOT_FOUND_IN_DATA")
          + additional_kwargs               │
                 │                    web_search node
                 │                          │
                 │                   AIMessage(answer)
                 │                   + additional_kwargs
                 └──────────┬───────────────┘
                             │
                     result.messages[-1]
                             │
                      { response, metadata, query_type, source }
```