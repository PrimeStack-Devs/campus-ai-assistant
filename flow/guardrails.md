# `guardrails.js` — Pre-Graph Safety & Query Classification

**Location:** `utils/guardrails.js`  
**Role:** Two exported functions — `applyGuardrails()` intercepts harmful, sensitive, or off-topic queries before the LangGraph graph runs; `detectQueryType()` classifies safe queries to select the right LLM response format.

---

## Module Map

```
guardrails.js
│
├── Pattern lists (module-level constants)
│   ├── BLOCKED_PATTERNS         RegExp[]
│   ├── SENSITIVE_TOPICS         Topic[]
│   └── OFF_TOPIC_PATTERNS       RegExp[]
│
├── OFF_TOPIC_RESPONSE           string
│
├── normalize(text)              → string
│
├── applyGuardrails(query)       → GuardrailResult | null
│
└── detectQueryType(query)       → "location" | "directions" | "person"
                                    | "service" | "policy" | "general"
```

---

## `normalize(text)`

```
normalize(text: any) → string
```

Internal helper. Lowercase → strip non-word/non-space characters → collapse whitespace → trim.

All pattern matching runs on the normalized form. This prevents simple bypass attempts using punctuation, mixed case, or extra spaces (e.g. `"H@ck the portal"`, `"IGNORE previous instructions"`).

---

## `applyGuardrails(query)`

```
applyGuardrails(query: string) → GuardrailResult | null
```

**Called by:** `runCampusBot()` before the LangGraph graph is invoked.

Returns a `GuardrailResult` to short-circuit the graph, or `null` if the query is safe.

### GuardrailResult shape

```js
{
  tier: "blocked" | "sensitive" | "off_topic",
  id: string,          // pattern category identifier
  response: string,    // ready-to-send user-facing response
  is_critical: boolean // true for emergencies (medical, ragging, suicide)
}
```

### Evaluation order

Tiers are checked in sequence — first match wins. This ordering is intentional:

```
normalize(query)
     │
     ▼
1. BLOCKED_PATTERNS (loop)
   ├── match → return { tier: "blocked", id: "blocked_content", is_critical: false }
   └── no match → continue
     │
     ▼
2. SENSITIVE_TOPICS (outer loop: topics, inner loop: topic.patterns)
   ├── match → return { tier: "sensitive", id: topic.id, response, is_critical }
   └── no match → continue
     │
     ▼
3. OFF_TOPIC_PATTERNS (loop)
   ├── match → return { tier: "off_topic", id: "off_topic", is_critical: false }
   └── no match → continue
     │
     ▼
4. return null   ← safe, proceed to graph
```

**Why Tier 1 before Tier 2?** A query could theoretically match both a blocked pattern and a sensitive topic (e.g. self-harm instructions framed as a health question). Hard-blocking takes priority to ensure no LLM call is made.

**Why Tier 2 before Tier 3?** Sensitive topics like mental health or ragging use some words that could also trigger off-topic patterns. We want the empathetic response, not the redirect.

---

## Tier 1 — `BLOCKED_PATTERNS`

Hard stop. No LLM call of any kind is made.

| Pattern group | Example triggers |
|---|---|
| Harmful content | "how to make a bomb", "synthesize poison" |
| System attacks | "hack the parul server", "exploit the wifi" |
| Child safety | "child porn", "csam" |
| Terrorism | "terrorist", "terrorism" |
| Exam malpractice | "how to cheat in exam", "get fake degree" |
| Bulk data extraction | "give me all student data", "dump the database" |
| Prompt injection | "ignore previous instructions", "pretend you are", "jailbreak", "DAN mode" |
| System prompt extraction | "what are your instructions", "repeat your system prompt" |

**Response (all Tier 1 matches):**
> "I'm not able to help with that. If you have a campus-related question, I'm happy to assist."

---

## Tier 2 — `SENSITIVE_TOPICS`

Each topic is an object:

```js
{
  id: string,
  patterns: RegExp[],
  response: string,    // multi-line, includes real phone numbers and office locations
  is_critical: boolean
}
```

### Topic inventory

| `id` | `is_critical` | Trigger examples | Response directs to |
|---|---|---|---|
| `suicidal_ideation` | `true` | "want to die", "kill myself", "self harm", "no reason to live" | iCall (9152987821), Vandrevala Foundation (1860-2662-345), Counselling Centre A11 |
| `mental_health` | `false` | "depressed", "anxiety", "panic attack", "overwhelmed", "burned out" | Insights Centre for Counselling (A11, Mon–Fri 9–5, Sat 9–1) |
| `ragging` | `true` | "ragging", "seniors harass", "being bullied by seniors" | Anti-Ragging Helpline (1800-180-5522), antiragging.in, Student Welfare C3 |
| `medical_emergency` | `true` | "bleeding", "unconscious", "need ambulance", "chest pain" | Parul Sevashram Hospital E2 (24/7), Campus Security |
| `sexual_harassment` | `true` | "sexually harassed", "unwanted touch", "POSH act", "ICC complaint" | ICC, Student Welfare Office C3 |
| `financial_distress` | `false` | "can't afford fees", "scholarship not received", "financial crisis" | Scholarship Section C1, Accounts Section C1 |

**Note on `is_critical`:** The flag is passed back to the route handler via `metadata`. The frontend can use this to render the response differently — e.g. highlighting emergency numbers, showing a banner, or triggering an alert sound.

---

## Tier 3 — `OFF_TOPIC_PATTERNS`

Catches general knowledge, programming tutorials, personal advice, entertainment, and national politics queries.

| Pattern group | Example triggers |
|---|---|
| Coding tutorials | "write a function for", "explain recursion", "what is Python used for" |
| General knowledge | "capital of India", "who invented electricity", "currency of Japan" |
| Entertainment | "cricket score", "Bollywood", "movie review", "song lyrics" |
| Finance | "bitcoin", "stock market", "cryptocurrency" |
| Food/weather | "recipe for biryani", "weather today", "temperature tomorrow" |
| Relationship advice | "should I break up", "my boyfriend is" |
| National politics | "Modi", "BJP", "election result", "vote for" |

**Response (all Tier 3 matches):**
> "I'm specifically here to help with everything related to Parul University — locations, departments, services, timings, policies, faculty, and campus life. That's a bit outside what I can help with. Is there anything about the campus I can assist you with?"

---

## `detectQueryType(query)`

```
detectQueryType(query: string)
  → "directions" | "location" | "person" | "service" | "policy" | "general"
```

**Called by:** `callLocalData()` in `ragPipeline.js` to select the matching LLM format template.

Runs on normalized query. First match wins (order matters — more specific types checked before general).

### Classification logic

```
normalize(query)
     │
     ▼
1. /how to reach|how do i get|directions? to|route (to|from)|walk(ing)? (to|from)|from (main gate|gate|hostel|block)/
   → "directions"

2. /where is|location of|find|how to find|nearest|where (can i find|do i go)/
   → "location"

3. /who is|hod|head of department|dean|professor|faculty|staff|contact (of|for)|email (of|for)|phone (of|for)/
   → "person"

4. /timing|timings|open|close|hours|when (does|is|are)|schedule|bus|canteen|mess|library|gym|pool|bank|atm/
   → "service"

5. /rule|policy|attendance|exam (rule|policy)|backlog|atkt|fine|hostel rule|dress code|conduct|scholarship (rule|process|eligibility)/
   → "policy"

6. (no match)
   → "general"
```

### Why `directions` is checked before `location`

A query like "how to reach the library" matches both `directions` (how to reach) and could match `location` (find). Since the student is asking for turn-by-turn guidance, `directions` gives the more useful `FORMAT_DIRECTIONS` template. Checking `directions` first ensures the right template is chosen.

---

## Decision Tree — Full Flow

```
applyGuardrails(rawQuery)
         │
         normalize
         │
         ▼
  ┌──────────────────┐
  │  BLOCKED check   │ ── match ──► return { tier: "blocked" }  (no LLM)
  └────────┬─────────┘
           │ no match
           ▼
  ┌──────────────────────┐
  │  SENSITIVE check     │
  │  (per topic)         │ ── match ──► return { tier: "sensitive", id, response, is_critical }
  └────────┬─────────────┘
           │ no match
           ▼
  ┌──────────────────────┐
  │  OFF_TOPIC check     │ ── match ──► return { tier: "off_topic" }
  └────────┬─────────────┘
           │ no match
           ▼
        return null
           │
    safe → runCampusBot
    invokes graph
           │
           ▼
  detectQueryType(query)
           │
     ┌─────┴──────┐
  directions  location  person  service  policy  general
     │
     ▼
  buildSystemPrompt(queryType)
  appends FORMAT_* template to CAMPUS_ASSISTANT_SYSTEM_PROMPT
```

---

## What Callers Receive

### From `applyGuardrails()`

```js
// Guardrail fired
{
  tier: "sensitive",
  id: "mental_health",
  response: "Hey, I hear you — ...\n📍 Insights Centre for Counselling...",
  is_critical: false
}

// Safe query
null
```

### From `detectQueryType()`

```js
"location"   // → FORMAT_LOCATION template appended to system prompt
"directions" // → FORMAT_DIRECTIONS template
"person"     // → FORMAT_PERSON template
"service"    // → FORMAT_SERVICE template
"policy"     // → FORMAT_POLICY template
"general"    // → no template appended, base prompt only
```

---

## Adding New Patterns — Developer Notes

**To add a new blocked pattern:**
```js
// In BLOCKED_PATTERNS array
/\b(your new harmful pattern here)\b/i
```

**To add a new sensitive topic:**
```js
// In SENSITIVE_TOPICS array
{
  id: "new_topic_id",
  patterns: [ /\b(trigger words)\b/i ],
  response: `Your empathetic response here with real contact info`,
  is_critical: true | false
}
```

**To add a new off-topic pattern:**
```js
// In OFF_TOPIC_PATTERNS array
/\b(pattern for off-topic queries)\b/i
```

**To add a new query type:**
```js
// In detectQueryType(), add before the "general" fallback
if (/\b(your trigger keywords)\b/.test(q)) return "new_type";

// In ragPipeline.js FORMAT_MAP
FORMAT_MAP["new_type"] = FORMAT_NEW_TYPE;

// In prompts.js
export const FORMAT_NEW_TYPE = `...`;
```
