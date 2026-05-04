// Shared agent event/step types for the research feature.
// Inspired by patterns from gpt-researcher (planner -> search -> synthesize),
// AutoGen (role-based agent steps), and AutoGPT (task-loop with statuses).

export type AgentStepKind =
  | "plan"
  | "search"
  | "read"
  | "reason"
  | "synthesize"
  | "final";

export type AgentStepStatus = "pending" | "running" | "done" | "error";

export interface AgentStep {
  id: string;
  kind: AgentStepKind;
  title: string;
  status: AgentStepStatus;
  detail?: string;
  sources?: AgentSource[];
}

export interface AgentSource {
  title: string;
  url: string;
  snippet?: string;
}

export type AgentEvent =
  | { type: "step"; step: AgentStep }
  | { type: "delta"; stepId: string; text: string }
  | { type: "final"; answer: string; sources: AgentSource[] }
  | { type: "error"; message: string }
  | { type: "info"; message: string };

export interface ResearchRequest {
  question: string;
  mode?: "fast" | "deep";
}
