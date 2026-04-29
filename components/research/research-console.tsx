"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AgentSource {
  title: string;
  url: string;
  snippet?: string;
}

type AgentStepKind =
  | "plan"
  | "search"
  | "read"
  | "reason"
  | "synthesize"
  | "final";

type AgentStepStatus = "pending" | "running" | "done" | "error";

interface AgentStep {
  id: string;
  kind: AgentStepKind;
  title: string;
  status: AgentStepStatus;
  detail?: string;
  sources?: AgentSource[];
}

type ServerEvent =
  | { type: "step"; step: AgentStep }
  | { type: "delta"; stepId: string; text: string }
  | { type: "final"; answer: string; sources: AgentSource[] }
  | { type: "error"; message: string }
  | { type: "info"; message: string }
  | { type: "done" };

const EXAMPLES = [
  "Compare LangChain vs AutoGen for building a multi-agent research workflow.",
  "What are the main risks of running AutoGPT-style autonomous agents in production?",
  "Summarize the architecture of gpt-researcher and how it gathers sources.",
];

function StepIcon({
  kind,
  status,
}: {
  kind: AgentStepKind;
  status: AgentStepStatus;
}) {
  if (status === "running")
    return <Loader2 className="size-4 animate-spin text-primary" />;
  if (status === "done")
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (kind === "plan") return <Sparkles className="size-4 text-primary" />;
  if (kind === "search") return <Search className="size-4 text-primary" />;
  if (kind === "reason" || kind === "synthesize")
    return <Brain className="size-4 text-primary" />;
  return <ChevronRight className="size-4 text-muted-foreground" />;
}

export function ResearchConsole() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"fast" | "deep">("fast");
  const [running, setRunning] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [finalSources, setFinalSources] = useState<AgentSource[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const upsertStep = useCallback((step: AgentStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id);
      if (idx === -1) return [...prev, step];
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...step };
      return copy;
    });
  }, []);

  const reset = useCallback(() => {
    setSteps([]);
    setAnswer(null);
    setFinalSources([]);
    setInfo(null);
    setError(null);
  }, []);

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = question.trim();
      if (!q || running) return;
      reset();
      setRunning(true);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, mode }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          setError(`Request failed: ${res.status} ${res.statusText}`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const block of events) {
            const line = block.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const json = line.slice(6);
            try {
              const evt = JSON.parse(json) as ServerEvent;
              if (evt.type === "step") upsertStep(evt.step);
              else if (evt.type === "final") {
                setAnswer(evt.answer);
                setFinalSources(evt.sources);
              } else if (evt.type === "info") setInfo(evt.message);
              else if (evt.type === "error") setError(evt.message);
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message ?? "Unknown error");
        }
      } finally {
        setRunning(false);
        abortRef.current = null;
      }
    },
    [mode, question, reset, running, upsertStep],
  );

  const onCancel = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const hasOutput = steps.length > 0 || answer || error;

  const groupedSources = useMemo(() => finalSources, [finalSources]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ask the research agent</CardTitle>
          <CardDescription>
            The agent plans sub-questions, searches the web, and synthesizes a
            cited answer. Works in demo mode without API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like the agent to research?"
              className="min-h-32 resize-y"
              disabled={running}
            />
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Research mode"
                className="inline-flex rounded-md border p-0.5 text-xs"
              >
                {(["fast", "deep"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={running}
                    aria-pressed={mode === m}
                    className={cn(
                      "rounded-sm px-2.5 py-1 capitalize transition",
                      mode === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                {running ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  disabled={running || !question.trim()}
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Researching…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Run agent
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="mr-1 font-medium">Try:</span>
              <span className="space-x-1">
                {EXAMPLES.map((ex) => (
                  <button
                    type="button"
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    disabled={running}
                    className="text-left underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    “{ex}”
                  </button>
                ))}
              </span>
            </div>
            {info ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {info}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Agent run</CardTitle>
          <CardDescription>
            Live structured steps: plan → search → reason → synthesize.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!hasOutput ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No run yet. Submit a question to start the agent.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {steps.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-md border p-3 text-sm transition",
                    step.status === "running" && "bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StepIcon kind={step.kind} status={step.status} />
                    <span className="font-medium">{step.title}</span>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs capitalize"
                    >
                      {step.status}
                    </Badge>
                  </div>
                  {step.detail ? (
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {step.detail}
                    </pre>
                  ) : null}
                  {step.sources && step.sources.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1 text-xs">
                      {step.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary hover:underline"
                          >
                            {s.title}
                          </a>
                          {s.snippet ? (
                            <span className="ml-1 text-muted-foreground">
                              — {s.snippet}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}

          {answer ? (
            <div className="rounded-md border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Answer</h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {answer}
              </div>
              {groupedSources.length > 0 ? (
                <div className="mt-4 border-t pt-3">
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Sources
                  </h4>
                  <ol className="ml-4 list-decimal text-xs">
                    {groupedSources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary hover:underline"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
