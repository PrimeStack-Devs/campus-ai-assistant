export const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${formatValue(nestedValue)}`)
      .filter((entry) => !entry.endsWith(": "))
      .join(" | ");
  }

  return String(value);
};

export const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const includesNormalized = (left, right) => {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};
