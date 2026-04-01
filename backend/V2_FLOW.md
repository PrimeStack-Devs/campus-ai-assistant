# Backend V2 Flow

This document explains the current backend v2 request flow used by `POST /api/v2/chat`.

It covers only the v2 path and does not describe the older `backend/routes/chat.js` route.

## Purpose

The v2 backend is a campus assistant pipeline that:

- receives a user message from the frontend
- applies safety and relevance guardrails
- tries to answer from local campus data first
- falls back to configured web sources if local data is not enough
- returns a structured JSON response with answer text and metadata

## Main Files Involved

- `backend/server.js`
- `backend/routes/v2/chat.js`
- `backend/services/v2/ragPipeline.js`
- `backend/services/v2/vectorStore.js`
- `backend/webCache.js`
- `backend/utils/guardrails.js`
- `backend/utils/prompts.js`
- `backend/config/redis.js`

## Startup Flow

Server startup begins in `backend/server.js`.

During startup, the backend:

1. connects Redis using `connectRedis()`
2. loads environment variables
3. creates the Express app
4. mounts the v2 route at `/api/v2/chat`
5. initializes the v2 campus vector store with `initializeStore()`
6. initializes the router service with `initializeRouter()`
7. starts the HTTP server

Important note:

- Redis is used in the web fallback layer for caching scraped source content
- the v2 conversation memory itself uses LangGraph `MemorySaver`, which is in-memory and resets on server restart

## Request Entry Point

The request enters through `backend/routes/v2/chat.js`.

Route:

- `POST /api/v2/chat`

Expected request body:

```json
{
  "message": "Where is the library?",
  "sessionId": "optional-session-id"
}
```

What the route does:

1. reads `message` and `sessionId` from `req.body`
2. validates that `message` exists
3. creates `threadId` from `sessionId` or generates a temporary one
4. calls `runCampusBot(message, threadId)`
5. returns the final API response

The route response shape is:

```json
{
  "success": true,
  "sessionId": "thread-or-session-id",
  "reply": "final answer text",
  "data": {},
  "queryType": "location",
  "source": "local",
  "timestamp": "2026-04-01T00:00:00.000Z"
}
```

## Runtime Flow

The main runtime logic lives in `backend/services/v2/ragPipeline.js`.

The route does not call the graph directly. It calls `runCampusBot(message, threadId)`, which acts as the v2 orchestration entry point.

### Step 1: Guardrails

`runCampusBot()` first calls `applyGuardrails(userMessage)` from `backend/utils/guardrails.js`.

This is a pre-graph safety and relevance check.

It can intercept:

- blocked content
- sensitive situations
- off-topic queries

If a guardrail matches:

- the graph does not run
- the function immediately returns a safe response
- metadata marks the response as guardrail-driven

If no guardrail matches:

- execution continues into the LangGraph workflow

### Step 2: LangGraph Execution

If guardrails allow the request, `runCampusBot()` calls:

```js
campusBot.invoke(
  { messages: [new HumanMessage(userMessage)] },
  { configurable: { thread_id: threadId } }
)
```

`thread_id` is important because it lets LangGraph associate the conversation with the correct session history.

The v2 graph currently has two nodes:

- `local_search`
- `web_search`

The entry point is always `local_search`.

## Local Search Node

The `local_search` node is the primary answer path.

### Query Classification

The node reads the latest user message and runs `detectQueryType()` from `backend/utils/guardrails.js`.

Possible query types:

- `location`
- `directions`
- `person`
- `service`
- `policy`
- `general`

This query type is used to choose the most suitable response format instructions from `backend/utils/prompts.js`.

### Location Intent Check

The node checks whether the query looks like a location or navigation request using `LOCATION_INTENT_PATTERN`.

If it is a location-style query, it tries to build a structured place bundle using:

- `getCampusPlaceBundle(lastUserMsg)`

This can return:

- destination building details
- building code
- coordinates
- nearby buildings
- route summary
- related departments in that building

### Semantic Search

The node also performs semantic retrieval using:

- `searchCampusData(lastUserMsg, 4)`

This searches the v2 campus vector store for the top matching campus documents.

### Confidence Decision

The best vector result is compared against:

- `VECTOR_SCORE_THRESHOLD = 0.55`

Decision logic:

- if a confident local result exists, continue with local answering
- if no confident local result exists and there is no useful place bundle, return `NOT_FOUND_IN_DATA`

That token is the graph signal that local data was not enough.

### Local Answer Generation

If local data is good enough, the node builds a context package from:

- top semantic search matches
- optional place bundle
- the last few conversation messages

Then it calls the LLM with:

- a system prompt built from the base campus prompt
- optional query-type formatting guidance
- campus context
- the user question

If the LLM still returns exactly `NOT_FOUND_IN_DATA`, the graph routes to the web fallback node.

Otherwise the node returns an `AIMessage` containing:

- `content`: final answer text
- `additional_kwargs.metadata`: structured metadata when available
- `additional_kwargs.query_type`: detected query type
- `additional_kwargs.source`: `"local"`

## Vector Store Details

The local semantic retrieval layer is implemented in `backend/services/v2/vectorStore.js`.

At startup, `initializeStore()` loads and indexes campus data from JSON files such as:

- `backend/campus-data/buildings.json`
- `backend/campus-data/departments.json`
- `backend/campus-data/facilities.json`
- `backend/campus-data/faculty.json`
- `backend/campus-data/policies.json`
- `backend/campus-data/paths.json`
- `backend/campus-data/services.json`
- `backend/campus-data/schedules.json`

What happens there:

1. each record is converted into searchable text
2. metadata is preserved on each document
3. Hugging Face embeddings are generated locally
4. documents are stored in a LangChain `MemoryVectorStore`

This makes the campus JSON dataset searchable by meaning, not just exact keyword match.

The same file also contains helper logic for:

- resolving buildings from query terms
- building place bundles for location questions
- attaching route and department context to place answers

## Web Fallback Node

If local search returns `NOT_FOUND_IN_DATA`, the graph moves to `web_search`.

This node uses `getWebAnswer(userQuery)` from `backend/webCache.js`.

### Web Source Matching

`getWebAnswer()` first tries to match the query to a configured source from:

- `backend/campus-data/web_sources.json`

If no source matches:

- the fallback cannot proceed with web content
- the system later produces a polite not-found response

### Cache and Scrape Flow

If a source matches, the web layer does one of the following:

1. if the source is URL-only, return the official link directly
2. otherwise check Redis cache
3. if cache misses, fetch and scrape the live page
4. cache the scraped result in Redis if TTL is configured

Redis connectivity is managed by `backend/config/redis.js`.

### Web Answer Generation

After content is retrieved, the node uses the web fallback prompt from `backend/utils/prompts.js` and asks the LLM to turn that content into a natural response.

Returned metadata can include:

- source label
- source URL
- cached or not
- scrape timestamp
- disclosure for third-party sources
- `source` as `"web"` or `"web_url_only"`

If no usable web content is found anywhere, the node uses `NOT_FOUND_PROMPT` to generate a short, helpful fallback answer with a suggested next step.

## Graph Routing Summary

The LangGraph decision path is:

1. start at `local_search`
2. if the last message is `NOT_FOUND_IN_DATA`, go to `web_search`
3. otherwise end the graph
4. after `web_search`, end the graph

So the v2 strategy is:

- local campus knowledge first
- web fallback second
- graceful not-found response last

## Conversation Memory

The v2 graph is compiled with LangGraph `MemorySaver`.

This means:

- conversation state is associated with `thread_id`
- repeated requests with the same `sessionId` can preserve chat context
- memory is in-process, not stored permanently
- restarting the backend clears that memory

Redis does not currently store LangGraph chat history.

Redis is only used for web-source caching in this flow.

## Final Response Back To Frontend

After `runCampusBot()` finishes, the route sends the final response back to the frontend.

Important response fields:

- `reply`: final answer text
- `data`: metadata from the local or web layer
- `queryType`: detected query type when available
- `source`: where the answer came from, such as `local`, `web`, `web_url_only`, or `guardrail`
- `sessionId`: the active thread/session identifier

## One-Line Summary

The v2 backend flow is:

`/api/v2/chat` -> `runCampusBot()` -> guardrails -> local campus retrieval -> web fallback if needed -> structured JSON response
