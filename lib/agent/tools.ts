import { TavilySearch } from "@langchain/tavily";

const SEARCH_TIMEOUT_MS = 15_000;

export function createSearchTool() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  return new TavilySearch({
    maxResults: 3,
    topic: "finance",
    includeAnswer: true,
    includeRawContent: false,
    tavilyApiKey: apiKey,
  });
}

export async function searchCompany(
  query: string,
  tool: TavilySearch | null
): Promise<string> {
  if (!tool) {
    return `No live search available. Analyze using general knowledge and note that real-time data was unavailable.`;
  }

  try {
    const results = await Promise.race([
      tool.invoke({ query }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Search timed out")), SEARCH_TIMEOUT_MS)
      ),
    ]);

    if (typeof results === "string") return results;
    return JSON.stringify(results, null, 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return `Search unavailable (${message}). Proceed with general knowledge and note the data gap.`;
  }
}
