# `vectorStore.js` — Vector Store & Place Bundle Engine

**Location:** `services/v2/vectorStore.js`  
**Role:** Builds and queries the in-memory semantic search index. Also provides a keyword-scoring place bundle engine that constructs rich structured location objects for navigation queries.

---

## Module Map

```
vectorStore.js
│
├── Module-level state
│   ├── vectorStore (MemoryVectorStore instance)
│   ├── embeddings  (HuggingFaceTransformersEmbeddings)
│   └── campusData  { buildings[], departments[], services[], paths[], routeSummaries[] }
│
├── formatValue(value)                          → string
│
├── initializeStore()                           → Promise<void>
│
├── searchCampusData(query, limit)              → Promise<[[Document, score], ...]>
│
├── Utility helpers
│   ├── normalizeText(value)                    → string
│   ├── includesNormalized(left, right)         → boolean
│   ├── queryHasAny(query, keywords)            → boolean
│   ├── getIntentAwareScore(query, meta, bldg)  → number
│   └── scoreCandidate(query, values)           → number
│
├── findBuildingForQuery(query)                 → Building | undefined
├── findBuildingFromMetadata(metadata)          → Building | null
│
├── getCampusPlaceBundle(query)                 → PlaceBundle | null
├── getRelevantPlaceBundleFromResults(q, res)   → PlaceBundle | null
│
└── getStore()                                  → MemoryVectorStore
```

---

## Module-level State

Three objects are initialised once at module load and shared across all functions:

```js
let vectorStore;          // MemoryVectorStore — holds all indexed documents

const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2"   // runs locally, no API key needed
});

const campusData = {
  buildings:      [],   // populated from buildings.json
  departments:    [],   // populated from departments.json
  services:       [],   // populated from services.json
  paths:          [],   // populated from paths.json
  routeSummaries: []    // populated from paths.json → route_summaries array
};
```

`campusData` is kept separate from the vector store because the place bundle engine needs direct random-access lookups (find by ID, filter by building_id) — operations the vector store doesn't support.

---

## `formatValue(value)`

```
formatValue(value: any) → string
```

Recursively converts any value to a flat string suitable for embedding.

| Input type | Output |
|---|---|
| `null / undefined / ""` | `""` (filtered out later) |
| `string / number` | `String(value)` |
| `Array` | each element formatted, joined with `", "` |
| `Object` | `"key: value | key: value"` (nested values recursively formatted) |

---

## `initializeStore()`

```
initializeStore() → Promise<void>
```

Reads all JSON files from `/campus-data/`, converts each record into a `Document`, and indexes them into the `MemoryVectorStore`.

### Step-by-step logic

```
1. Define files list with { name, category, isPath? }

2. For each file:
   a. Check if file exists — skip with warning if not
   b. Parse JSON

   c. Side-effects (populate campusData cache):
      buildings.json  → campusData.buildings
      departments.json → campusData.departments
      services.json   → campusData.services

   d. Special handling for paths.json (isPath: true):
      campusData.paths         = rawData.paths
      campusData.routeSummaries = rawData.route_summaries
      For each path → create Document with natural language route string
      → continue (skip standard handling below)

   e. Standard handling for all other files:
      Extract array from rawData (tries Array.isArray, then Object.values().find(Array.isArray))
      For each item → build searchableFields[] → join into pageContent
      Create Document({ pageContent, metadata: { ...item, category } })

3. Create MemoryVectorStore(embeddings)

4. Add all documents in batches of 8:
   for i = 0; i < allDocs.length; i += 8
     await vectorStore.addDocuments(allDocs.slice(i, i + 8))
   (batching prevents memory spikes with local CPU embeddings)

5. Log: "Indexed N campus documents"
```

### Searchable fields per document

Each non-path record is serialised as:

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

Empty fields (ending in `": "`) are filtered out before joining.

Path records are serialised as a single natural language sentence:

```
Route from Main Gate to CV Raman Centre.
Distance: 620m. Time: 8 min.
Directions: Head straight past PU Circle...
Landmarks: PU Circle, C1 Admin Block, Watcher's Park
```

---

## `searchCampusData(query, limit)`

```
searchCampusData(query: string, limit: number = 2)
  → Promise<[[Document, score], ...]>
```

Runs cosine similarity search against the vector store.

- Throws if `vectorStore` is not yet initialised (i.e. `initializeStore()` hasn't completed)
- Returns `limit` results sorted by similarity score descending
- Score range: 0.0–1.0 (higher = more similar)

Used directly by `callLocalData()` in the graph. The caller checks `results[0][1]` against `VECTOR_SCORE_THRESHOLD`.

---

## Utility Helpers

### `normalizeText(value)`

```
normalizeText(value: any) → string
```

Lowercase → strip non-alphanumeric (replace with space) → collapse whitespace → trim.

Used as the canonical comparison form throughout the scoring functions.

---

### `includesNormalized(left, right)`

```
includesNormalized(left: any, right: any) → boolean
```

Returns true if either normalized value includes the other (bidirectional substring match).

Used for loose matching in route summary lookup and building name cross-referencing.

---

### `queryHasAny(query, keywords)`

```
queryHasAny(query: string, keywords: string[]) → boolean
```

Returns true if the normalized query contains any of the normalized keywords.

Used by `getIntentAwareScore()` to detect health, food, and hostel topic signals.

---

### `getIntentAwareScore(query, metadata, building)`

```
getIntentAwareScore(query: string, metadata: object, building: object) → number
```

Applies bonus/penalty adjustments based on detected topic vs. matched entity type.

| Topic detected | Entity match | Score change |
|---|---|---|
| Health keywords (fever, sick, doctor...) | medical/hospital/pharmacy entity | +10 |
| Health keywords | mess/canteen/temple entity | −6 |
| Food keywords (canteen, mess, eat...) | canteen/restaurant/dining entity | +10 |
| Food keywords | temple/hospital entity | −5 |
| Hostel keywords (hostel, warden...) | hostel/rector entity | +4 |

**Why this exists:** Cosine similarity can match "health centre" to "food court" if both share enough lexical overlap. Intent scoring corrects these domain-crossing false matches.

---

### `scoreCandidate(query, values)`

```
scoreCandidate(query: string, values: string[]) → number
```

Keyword overlap scorer for direct entity matching (not embedding-based).

| Match type | Score added |
|---|---|
| Exact full match | +10 |
| Query contains value | +6 |
| Value contains query | +5 |
| Token-level overlap | +1 per matching token |

Used by `findBuildingForQuery()` to rank building/department/service candidates.

---

## `findBuildingForQuery(query)`

```
findBuildingForQuery(query: string) → Building | undefined
```

Three-way keyword scorer that finds the most relevant building for a query by searching across buildings, departments, and services.

### Logic

```
1. Score all buildings directly:
   scoreCandidate(query, [name, short_name, code, ...aliases])

2. Score all departments:
   scoreCandidate(query, [name, short_name, building_name, ...aliases])
   → resolve department.building_id to a building

3. Score all services:
   scoreCandidate(query, [name, type, building_name, ...aliases])
   → resolve service.building_id to a building

4. Merge all three candidate lists
5. Filter out candidates with building = null or score = 0
6. Sort by score descending
7. Return top[0].building
```

This means "Where is the Computer Science department?" will correctly resolve to the building that contains the CS department, not just the building named "Computer Science".

---

## `findBuildingFromMetadata(metadata)`

```
findBuildingFromMetadata(metadata: object) → Building | null
```

Lookup chain — tries each strategy in order, returns first match:

```
1. campusData.buildings.find(b => b.id === metadata.id)
2. campusData.buildings.find(b => b.code === metadata.code)
3. campusData.buildings.find(b => b.id === metadata.building_id)
4. campusData.buildings.find(b => b.name === metadata.building_name)
5. campusData.buildings.find(b => includesNormalized(b.name, metadata.building_name))
6. campusData.buildings.find(b => includesNormalized(b.name, metadata.name))
7. null (no match found)
```

Used by `getRelevantPlaceBundleFromResults()` to map a vector search result's metadata back to a concrete building record.

---

## `getCampusPlaceBundle(query)`

```
getCampusPlaceBundle(query: string) → PlaceBundle | null
```

Builds a rich structured location object for navigation queries. **Keyword-based, not vector-based.**

### Logic

```
1. findBuildingForQuery(query) → building (or null → return null)

2. Find related departments:
   campusData.departments
     .filter(d => d.building_id === building.id)
     .slice(0, 5)
     .map(d => { name, floor, programs })

3. Find route summary (tries in order):
   a. campusData.routeSummaries.find() — match by building name/code in label or summary
   b. campusData.paths.find() — match to === building.id AND from_name contains "main gate"
   c. null

4. Return PlaceBundle:
   {
     type: "place_bundle",
     destination: {
       id, code, name, short_name, description, zone, floors,
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

### PlaceBundle return shape

```js
{
  type: "place_bundle",
  destination: {
    id: "a25",
    code: "A25",
    name: "CV Raman Centre",
    short_name: "CV Raman",
    description: "Main science and engineering block",
    zone: "north-central",
    floors: 7,
    coordinates: { lat: 22.123, lng: 73.456, verified: true },
    nearby: ["a24", "a26"],
    aliases: ["CV Raman", "science block"]
  },
  route: {
    label: "Main Gate to CV Raman Centre",
    summary: "Head straight from Main Gate...",
    distance_m: 620,
    walk_minutes: 8,
    landmarks: ["PU Circle", "C1 Admin Block"]
  },
  related_departments: [
    { name: "Dept. of CS&E", floor: 3, programs: ["B.Tech CSE"] }
  ]
}
```

---

## `getRelevantPlaceBundleFromResults(query, searchResults)`

```
getRelevantPlaceBundleFromResults(
  query: string,
  searchResults: [[Document, score], ...]
) → PlaceBundle | null
```

Layers intent-aware scoring on top of vector search results to find the most contextually relevant building, then calls `getCampusPlaceBundle()` for that building.

### Logic

```
1. For each [doc, similarity] in searchResults:
   a. findBuildingFromMetadata(doc.metadata) → building
   b. Skip if building has no GPS coordinates (lat/lng)
   c. Score candidate:
      queryScore   = scoreCandidate(query, [metadata fields + building fields])
      intentScore  = getIntentAwareScore(query, metadata, building)

2. Sort candidates by:
   1st: (queryScore + intentScore) descending
   2nd: queryScore descending (tiebreaker)
   3rd: similarity descending (tiebreaker)

3. Take best candidate
4. getCampusPlaceBundle(best.metadata.building_name || best.metadata.name || best.building.name)
5. If bundle found, extend it with matched_entity:
   {
     ...bundle,
     matched_entity: {
       id, name, category,
       building_id, building_name
     }
   }
```

**Difference from `getCampusPlaceBundle()`:** This function starts from vector search results (which capture semantic similarity) and then re-ranks them with intent scoring. `getCampusPlaceBundle()` starts from pure keyword scoring. They serve different callers:

| Function | Called by | Input source |
|---|---|---|
| `getCampusPlaceBundle()` | `callLocalData` directly (location queries) | raw query string |
| `getRelevantPlaceBundleFromResults()` | `callLocalData` (for metadata on any match) | vector search results |

---

## Data Flow Within Module

```
initializeStore()
   reads JSON files
        │
        ├──► campusData (buildings, departments, services, paths, routeSummaries)
        │         used by: findBuildingForQuery, findBuildingFromMetadata,
        │                  getCampusPlaceBundle, getRelevantPlaceBundleFromResults
        │
        └──► vectorStore (MemoryVectorStore)
                  used by: searchCampusData


searchCampusData(query, limit)
   → [[Document, score], ...]
   consumed by: callLocalData (ragPipeline)
                getRelevantPlaceBundleFromResults


getCampusPlaceBundle(query)
   findBuildingForQuery → building
   departments filter  → related_departments
   routeSummaries/paths → route
   → PlaceBundle
   consumed by: callLocalData (directly, for location queries)
                getRelevantPlaceBundleFromResults (delegates to it for final bundle)


getRelevantPlaceBundleFromResults(query, searchResults)
   findBuildingFromMetadata (per result)
   scoreCandidate + getIntentAwareScore (per result)
   getCampusPlaceBundle(best candidate)
   → extended PlaceBundle with matched_entity
   consumed by: callLocalData (for metadata on non-location queries)
```
