export function formatCampusContext(searchResults = []) {
  return searchResults
    .map(
      ([doc, docScore], index) =>
        `Match ${index + 1} (score: ${docScore.toFixed(3)}):\n${doc.pageContent}`,
    )
    .join("\n\n");
}
