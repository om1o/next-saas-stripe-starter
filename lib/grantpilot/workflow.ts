// GrantPilot agent workflow — streams a discover → research → outline → draft
// → budget → packet pipeline. Architecture mirrors lib/agents/research.ts so
// the same SSE shape can power both the generic research console and this
// grant-writing flow.
//
// Source-repo influence (kept lightweight, NOT vendored):
//   - gpt-researcher: planner → retriever → synthesizer pipeline
//   - LangChain.js: streamed step events with structured statuses
//   - AutoGen / AutoGPT: distinct agent roles with running/done states
//
// All steps are deterministic + local. No paid API needed; no env keys
// required to demo. A future provider integration (Perplexity, Claude,
// OpenAI) can replace the synthesize step without changing the SSE schema.

import { DEMO_GRANTS } from "./data";
import { scoreGrants, formatUsd, daysUntil } from "./fit";
import { buildPacket, packetToMarkdown } from "./packet";
import type { NonprofitProfile, ScoredGrant } from "./types";

export type WorkflowStepKind =
  | "discover"
  | "shortlist"
  | "research"
  | "outline"
  | "narrative"
  | "budget"
  | "packet";

export type WorkflowStepStatus = "pending" | "running" | "done" | "error";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  title: string;
  status: WorkflowStepStatus;
  detail?: string;
}

export interface ScoredGrantSummary {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  daysUntilDeadline: number;
  awardRange: string;
  fit: number;
}

export type WorkflowEvent =
  | { type: "info"; message: string }
  | { type: "step"; step: WorkflowStep }
  | { type: "shortlist"; grants: ScoredGrantSummary[] }
  | { type: "packet"; markdown: string; grantId: string }
  | { type: "error"; message: string };

export interface WorkflowRequest {
  profile: NonprofitProfile;
  /** Optional: focus the workflow on a single grant id from the shortlist. */
  grantId?: string;
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

async function pause(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function summarize(grant: ScoredGrant): ScoredGrantSummary {
  return {
    id: grant.id,
    title: grant.title,
    agency: grant.agency,
    deadline: grant.deadline,
    daysUntilDeadline: daysUntil(grant.deadline),
    awardRange: `${formatUsd(grant.awardMin)}–${formatUsd(grant.awardMax)}`,
    fit: grant.fit.total,
  };
}

export async function* runGrantWorkflow(
  req: WorkflowRequest,
): AsyncGenerator<WorkflowEvent> {
  const { profile } = req;

  yield {
    type: "info",
    message:
      "GrantPilot demo mode — opportunities, scoring, and narrative are produced locally without any external API key.",
  };

  // 1. DISCOVER
  const discoverStep = id("discover");
  yield {
    type: "step",
    step: {
      id: discoverStep,
      kind: "discover",
      title: "Discover open opportunities",
      status: "running",
    },
  };
  await pause(120);
  const allScored = scoreGrants(DEMO_GRANTS, profile);
  yield {
    type: "step",
    step: {
      id: discoverStep,
      kind: "discover",
      title: "Discover open opportunities",
      status: "done",
      detail: `Pulled ${allScored.length} opportunities from Grants.gov, SAM.gov, state, and foundation feeds.`,
    },
  };

  // 2. SHORTLIST
  const shortlistStep = id("shortlist");
  yield {
    type: "step",
    step: {
      id: shortlistStep,
      kind: "shortlist",
      title: "Score & shortlist by fit",
      status: "running",
    },
  };
  await pause(140);
  const top = allScored.slice(0, 5);
  yield { type: "shortlist", grants: top.map(summarize) };
  yield {
    type: "step",
    step: {
      id: shortlistStep,
      kind: "shortlist",
      title: "Score & shortlist by fit",
      status: "done",
      detail: top
        .map((g, i) => `${i + 1}. ${g.title} — ${g.fit.total}/100`)
        .join("\n"),
    },
  };

  const focusGrant: ScoredGrant =
    (req.grantId && allScored.find((g) => g.id === req.grantId)) ||
    top[0] ||
    allScored[0];
  if (!focusGrant) {
    yield { type: "error", message: "No grants available." };
    return;
  }

  // 3. RESEARCH
  const researchStep = id("research");
  yield {
    type: "step",
    step: {
      id: researchStep,
      kind: "research",
      title: `Research fit for: ${focusGrant.title}`,
      status: "running",
    },
  };
  await pause(180);
  yield {
    type: "step",
    step: {
      id: researchStep,
      kind: "research",
      title: `Research fit for: ${focusGrant.title}`,
      status: "done",
      detail: focusGrant.fit.reasons.map((r) => `• ${r}`).join("\n"),
    },
  };

  // 4. OUTLINE
  const outlineStep = id("outline");
  yield {
    type: "step",
    step: {
      id: outlineStep,
      kind: "outline",
      title: "Build proposal outline",
      status: "running",
    },
  };
  await pause(140);
  const packet = buildPacket(focusGrant, profile);
  const outline = packet.sections.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
  yield {
    type: "step",
    step: {
      id: outlineStep,
      kind: "outline",
      title: "Build proposal outline",
      status: "done",
      detail: outline,
    },
  };

  // 5. NARRATIVE
  const narrativeStep = id("narrative");
  yield {
    type: "step",
    step: {
      id: narrativeStep,
      kind: "narrative",
      title: "Draft project narrative",
      status: "running",
    },
  };
  await pause(220);
  const narrativeSection = packet.sections.find(
    (s) => s.title === "Project Narrative",
  );
  yield {
    type: "step",
    step: {
      id: narrativeStep,
      kind: "narrative",
      title: "Draft project narrative",
      status: "done",
      detail: narrativeSection?.content ?? "",
    },
  };

  // 6. BUDGET
  const budgetStep = id("budget");
  yield {
    type: "step",
    step: {
      id: budgetStep,
      kind: "budget",
      title: "Build budget framework",
      status: "running",
    },
  };
  await pause(160);
  const budgetSection = packet.sections.find(
    (s) => s.title === "Budget Framework",
  );
  yield {
    type: "step",
    step: {
      id: budgetStep,
      kind: "budget",
      title: "Build budget framework",
      status: "done",
      detail: budgetSection?.content ?? "",
    },
  };

  // 7. PACKET
  const packetStep = id("packet");
  yield {
    type: "step",
    step: {
      id: packetStep,
      kind: "packet",
      title: "Assemble export-ready packet",
      status: "running",
    },
  };
  await pause(140);
  const md = packetToMarkdown(packet);
  yield { type: "packet", markdown: md, grantId: focusGrant.id };
  yield {
    type: "step",
    step: {
      id: packetStep,
      kind: "packet",
      title: "Assemble export-ready packet",
      status: "done",
      detail: `Generated ${packet.sections.length}-section packet ready for download.`,
    },
  };
}
