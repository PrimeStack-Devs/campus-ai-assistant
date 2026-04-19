import { normalizeText } from "../utils/text.js";

const HEALTH_KEYWORDS = [
  "fever",
  "sick",
  "ill",
  "pain",
  "vomit",
  "vomiting",
  "headache",
  "injury",
  "bleeding",
  "doctor",
  "hospital",
  "medical",
  "medicine",
  "emergency",
  "first aid",
  "ambulance",
  "pharmacy",
  "health",
];

const FOOD_KEYWORDS = [
  "canteen",
  "food",
  "food court",
  "mess",
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "tea",
  "coffee",
  "eat",
];

const HOSTEL_KEYWORDS = [
  "hostel",
  "warden",
  "room",
  "allotment",
  "rector",
  "superintendent",
];

const queryHasAny = (query, keywords) => {
  const normalizedQuery = normalizeText(query);
  return keywords.some((keyword) =>
    normalizedQuery.includes(normalizeText(keyword)),
  );
};

const hasTokenSequence = (queryTokens, valueTokens) => {
  if (!valueTokens.length || valueTokens.length > queryTokens.length) {
    return false;
  }

  for (let i = 0; i <= queryTokens.length - valueTokens.length; i += 1) {
    let isMatch = true;

    for (let j = 0; j < valueTokens.length; j += 1) {
      if (queryTokens[i + j] !== valueTokens[j]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) return true;
  }

  return false;
};

export const getIntentAwareScore = (query, metadata = {}, building = {}) => {
  const values = [
    metadata.type,
    metadata.category,
    metadata.name,
    metadata.label,
    metadata.title,
    metadata.notes,
    metadata.description,
    building.category,
    building.name,
    building.description,
    ...(metadata.aliases || []),
    ...(building.aliases || []),
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value));

  let score = 0;

  if (queryHasAny(query, HEALTH_KEYWORDS)) {
    if (
      values.some((value) =>
        /hospital|medical|doctor|emergency|first aid|pharmacy|health/.test(
          value,
        ),
      )
    ) {
      score += 10;
    }
    if (
      values.some((value) =>
        /mess|canteen|food court|restaurant|temple/.test(value),
      )
    ) {
      score -= 6;
    }
  }

  if (queryHasAny(query, FOOD_KEYWORDS)) {
    if (
      values.some((value) =>
        /mess|canteen|food court|restaurant|dining|snacks|tea|coffee/.test(
          value,
        ),
      )
    ) {
      score += 10;
    }
    if (values.some((value) => /temple|hospital/.test(value))) {
      score -= 5;
    }
  }

  if (queryHasAny(query, HOSTEL_KEYWORDS)) {
    if (
      values.some((value) =>
        /hostel|warden|rector|superintendent/.test(value),
      )
    ) {
      score += 4;
    }
  }

  return score;
};

export const scoreCandidate = (query, values) => {
  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const queryTokenSet = new Set(queryTokens);
  let score = 0;

  for (const value of values.filter(Boolean)) {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) continue;

    const valueTokens = normalizedValue.split(" ").filter(Boolean);
    const isShortSingleToken =
      valueTokens.length === 1 && valueTokens[0].length <= 1;

    if (normalizedValue === normalizedQuery) score += 10;
    else if (queryTokenSet.has(normalizedValue)) score += 7;
    else if (hasTokenSequence(queryTokens, valueTokens)) score += 6;
    else if (
      !isShortSingleToken &&
      normalizedValue.length >= 3 &&
      normalizedValue.includes(normalizedQuery)
    ) {
      score += 5;
    } else {
      const overlap = valueTokens
        .filter((token) => token.length > 1)
        .filter((token) => queryTokenSet.has(token)).length;
      score += overlap;
    }
  }

  return score;
};
