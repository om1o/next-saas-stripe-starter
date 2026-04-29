// Research agent orchestrator. Inspired by:
//   - gpt-researcher: planner -> retriever -> synthesizer pipeline
//   - AutoGPT: autonomous task loop with statuses
//   - AutoGen: distinct agent roles (planner / researcher / writer)
//   - langchainjs / openai-assistants-quickstart: streamed step events
//
// This module is intentionally framework-light and provider-neutral: it
// produces a stream of AgentEvent values which the API route forwards over
// Server-Sent Events. Planning and synthesis are deterministic and run
// locally — Tavily is the only optional live integration.

import { webSearch } from "./search";
import { planSubQueries, synthesize } from "./synthesizer";
import { AgentEvent, AgentSource, ResearchRequest } from "./types";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function* runResearch(
  req: ResearchRequest,
): AsyncGenerator<AgentEvent> {
  const question = req.question.trim();
  if (!question) {
    yield { type: "error", message: "Question is required." };
    return;
  }

  const searchReady = Boolean(process.env.TAVILY_API_KEY);
  yield {
    type: "info",
    message: `Synthesis: local · Search: ${searchReady ? "live (Tavily)" : "demo"}`,
  };

  // 1. PLAN
  const planStepId = id("plan");
  yield {
    type: "step",
    step: {
      id: planStepId,
      kind: "plan",
      title: "Plan sub-questions",
      status: "running",
    },
  };
  const subQueries = planSubQueries(question, req.mode === "deep" ? 4 : 3);
  yield {
    type: "step",
    step: {
      id: planStepId,
      kind: "plan",
      title: "Plan sub-questions",
      status: "done",
      detail: subQueries.map((q, i) => `${i + 1}. ${q}`).join("\n"),
    },
  };

  // 2. SEARCH per sub-query (in parallel; emit step transitions)
  const allSources: AgentSource[] = [];
  const searchStepIds = subQueries.map(() => id("search"));
  for (let i = 0; i < subQueries.length; i++) {
    yield {
      type: "step",
      step: {
        id: searchStepIds[i],
        kind: "search",
        title: `Search: ${subQueries[i]}`,
        status: "running",
      },
    };
  }
  const perQueryResults = await Promise.all(
    subQueries.map((q) => webSearch(q, 4)),
  );
  for (let i = 0; i < subQueries.length; i++) {
    const sources = perQueryResults[i];
    allSources.push(...sources);
    yield {
      type: "step",
      step: {
        id: searchStepIds[i],
        kind: "search",
        title: `Search: ${subQueries[i]}`,
        status: "done",
        sources,
      },
    };
  }

  // De-duplicate sources by URL.
  const seen = new Set<string>();
  const dedupedSources = allSources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  // 3. REASON
  const reasonStepId = id("reason");
  yield {
    type: "step",
    step: {
      id: reasonStepId,
      kind: "reason",
      title: "Reason over sources",
      status: "running",
    },
  };
  await sleep(150); // small UX pause so the running state is visible
  yield {
    type: "step",
    step: {
      id: reasonStepId,
      kind: "reason",
      title: "Reason over sources",
      status: "done",
      detail: `Considered ${dedupedSources.length} unique sources across ${subQueries.length} sub-queries.`,
    },
  };

  // 4. SYNTHESIZE
  const synthStepId = id("synth");
  yield {
    type: "step",
    step: {
      id: synthStepId,
      kind: "synthesize",
      title: "Synthesize answer",
      status: "running",
    },
  };
  const answer = synthesize({ question, sources: dedupedSources });
  yield {
    type: "step",
    step: {
      id: synthStepId,
      kind: "synthesize",
      title: "Synthesize answer",
      status: "done",
    },
  };

  // 5. FINAL
  yield { type: "final", answer, sources: dedupedSources };
}
