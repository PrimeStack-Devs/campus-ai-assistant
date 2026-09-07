import axios from "axios";

/**
 * Searches the web via Tavily API with Parul University context.
 * Performs a search scoped to Parul University Vadodara, prioritizing
 * official domain ('paruluniversity.ac.in') links for citations when available.
 *
 * @param {string} query - Student's search query
 * @returns {Promise<{
 *   success: boolean,
 *   content: string,
 *   source_label: string,
 *   source_url: string,
 *   is_official: boolean,
 *   scraped_at: string,
 *   all_results: Array<{ title: string, url: string, content: string }>
 * } | null>}
 */
export async function searchTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("[Tavily] No TAVILY_API_KEY configured in environment.");
    return null;
  }

  const normalizedQuery = (query || "").trim();
  if (!normalizedQuery) return null;

  // Add campus context if not already explicitly stated
  const campusQuery = /parul/i.test(normalizedQuery)
    ? normalizedQuery
    : `${normalizedQuery} Parul University Vadodara`;

  console.log(`[Tavily] Executing search for: "${campusQuery}"`);

  let searchResults = [];

  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: apiKey,
        query: campusQuery,
        max_results: 5,
        search_depth: "basic",
      },
      { timeout: 9000 }
    );

    searchResults = res.data?.results || [];
  } catch (err) {
    console.error("[Tavily] Web search error:", err.message);
    return null;
  }

  if (searchResults.length === 0) {
    console.log("[Tavily] No relevant web search results found.");
    return null;
  }

  // Find official result if available among top results, otherwise use the highest ranked result
  const officialResult = searchResults.find(
    (r) => r.url && r.url.includes("paruluniversity.ac.in")
  );

  const topResult = officialResult || searchResults[0];
  const isOfficial = !!officialResult;

  console.log(
    `[Tavily] Found ${searchResults.length} results. Citation: "${topResult.title}" (${isOfficial ? "Official" : "Web"})`
  );

  // Combine top snippets into structured content for LLM grounding
  const combinedContent = searchResults
    .slice(0, 4)
    .map((r, idx) => `[Source ${idx + 1}: ${r.title} (${r.url})]\n${r.content}`)
    .join("\n\n");

  return {
    success: true,
    content: combinedContent,
    source_label: topResult.title || "Parul University Web Portal",
    source_url: topResult.url || "https://paruluniversity.ac.in",
    is_official: isOfficial,
    scraped_at: new Date().toISOString(),
    all_results: searchResults.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    })),
  };
}
