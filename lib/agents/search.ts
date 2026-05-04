import { AgentSource } from "./types";

// Lightweight web search abstraction. Uses Tavily when TAVILY_API_KEY is set
// (mirrors the retriever pattern used by gpt-researcher). Otherwise returns
// a deterministic demo result so local dev / CI never depends on a paid API.

export async function webSearch(
  query: string,
  maxResults = 5,
): Promise<AgentSource[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return demoSources(query, maxResults);
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        max_results: maxResults,
        search_depth: "basic",
      }),
    });
    if (!res.ok) throw new Error(`tavily ${res.status}`);
    const data = (await res.json()) as {
      results?: { title: string; url: string; content?: string }[];
    };
    const results = data.results ?? [];
    return results.slice(0, maxResults).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 280),
    }));
  } catch {
    return demoSources(query, maxResults);
  }
}

function demoSources(query: string, n: number): AgentSource[] {
  const seeds = [
    {
      title: "Wikipedia",
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
      snippet: `Encyclopedia entry related to "${query}". (demo source)`,
    },
    {
      title: "arXiv",
      url: `https://arxiv.org/search/?query=${encodeURIComponent(query)}`,
      snippet: `Recent arXiv preprints related to "${query}". (demo source)`,
    },
    {
      title: "Hacker News",
      url: `https://hn.algolia.com/?q=${encodeURIComponent(query)}`,
      snippet: `Recent HN discussions about "${query}". (demo source)`,
    },
    {
      title: "GitHub",
      url: `https://github.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Repositories and code matching "${query}". (demo source)`,
    },
    {
      title: "MDN Web Docs",
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
      snippet: `Developer documentation entries for "${query}". (demo source)`,
    },
  ];
  return seeds.slice(0, n);
}
