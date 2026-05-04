// Provider-neutral, deterministic local synthesizer for the research agent.
//
// The agent intentionally has no paid-LLM dependency. Planning and answer
// synthesis are produced locally from the user's question and the source
// list returned by the search tool, so the feature works offline, in CI, and
// in any deployment without configuring third-party LLM credentials.
//
// If a future contributor wants to plug in a real LLM, they can replace
// `planSubQueries` and `synthesize` with a provider-specific implementation
// behind a server-side env var — but no such variable is required today.

import { AgentSource } from "./types";

export function planSubQueries(question: string, count = 3): string[] {
  const trimmed = question.replace(/\s+/g, " ").trim();
  const variants = [
    `${trimmed} overview`,
    `${trimmed} latest developments`,
    `${trimmed} pros and cons`,
    `${trimmed} examples`,
  ];
  return variants.slice(0, Math.max(1, count));
}

export interface SynthesisInput {
  question: string;
  sources: AgentSource[];
}

// Build a structured, citation-style markdown answer from the sources.
// Deterministic: same input → same output. No network calls.
export function synthesize({ question, sources }: SynthesisInput): string {
  const q = question.trim();
  if (sources.length === 0) {
    return [
      `**${q}**`,
      "",
      "No sources were available, so the agent cannot ground an answer.",
      "Configure `TAVILY_API_KEY` to enable live web search, or retry the",
      "question once sources are reachable.",
    ].join("\n");
  }

  const bullets = sources.slice(0, 5).map((s, i) => {
    const snippet = s.snippet?.replace(/\s+/g, " ").trim();
    const detail = snippet ? ` — ${truncate(snippet, 180)}` : "";
    return `- [${i + 1}] **${s.title}**${detail}`;
  });

  const plural = sources.length === 1 ? "" : "s";
  return [
    `**${q}**`,
    "",
    "Synthesis based on the sources gathered by the agent:",
    "",
    ...bullets,
    "",
    `The agent collected ${sources.length} unique source${plural} for this ` +
      `question. Cross-reference the numbered links above for the underlying ` +
      `detail; this answer is generated locally without a paid LLM.`,
  ].join("\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
