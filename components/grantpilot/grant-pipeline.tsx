"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Filter, MapPin, Sparkles } from "lucide-react";

import { daysUntil, formatUsd } from "@/lib/grantpilot/fit";
import type { GrantStatus, ScoredGrant } from "@/lib/grantpilot/types";
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
import { Progress } from "@/components/ui/progress";

const STATUSES: { value: GrantStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "discovered", label: "Discovered" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting" },
  { value: "ready", label: "Ready" },
  { value: "submitted", label: "Submitted" },
];

interface GrantPipelineProps {
  grants: ScoredGrant[];
  selectedId: string | null;
  onSelect: (grantId: string) => void;
  onRunWorkflow: (grantId: string) => void;
}

function StatusPill({ status }: { status: GrantStatus }) {
  const tone: Record<GrantStatus, string> = {
    discovered: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    researching: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    drafting: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    submitted: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    passed: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        tone[status],
      )}
    >
      {status}
    </span>
  );
}

function FitMeter({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-emerald-500"
      : score >= 45
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function GrantPipeline({
  grants,
  selectedId,
  onSelect,
  onRunWorkflow,
}: GrantPipelineProps) {
  const [filter, setFilter] = useState<GrantStatus | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? grants : grants.filter((g) => g.status === filter)),
    [grants, filter],
  );

  const stats = useMemo(() => {
    const totalAvg = grants.length
      ? Math.round(
          grants.reduce((acc, g) => acc + g.fit.total, 0) / grants.length,
        )
      : 0;
    const next = grants
      .map((g) => daysUntil(g.deadline))
      .filter((d) => d >= 0)
      .sort((a, b) => a - b)[0];
    const totalCeiling = grants.reduce((acc, g) => acc + g.awardMax, 0);
    return { totalAvg, next, totalCeiling };
  }, [grants]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Grant pipeline</CardTitle>
            <CardDescription>
              Federal, state, and foundation opportunities ranked by fit to
              your profile.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide">Avg fit</div>
              <div className="text-sm font-semibold text-foreground">
                {stats.totalAvg}/100
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide">
                Next deadline
              </div>
              <div className="text-sm font-semibold text-foreground">
                {stats.next === undefined ? "—" : `${stats.next}d`}
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide">
                Pipeline ceiling
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formatUsd(stats.totalCeiling)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          {STATUSES.map((s) => {
            const active = filter === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter(s.value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No grants match this filter.
          </div>
        ) : (
          <ul className="grid gap-2">
            {filtered.map((grant) => {
              const due = daysUntil(grant.deadline);
              const dueTone =
                due < 14
                  ? "text-rose-600 dark:text-rose-400"
                  : due < 30
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground";
              const selected = grant.id === selectedId;
              return (
                <li key={grant.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(grant.id)}
                    className={cn(
                      "group flex w-full flex-col gap-2 rounded-lg border bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent/30",
                      selected && "border-primary ring-1 ring-primary/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {grant.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {grant.agency} · {grant.source}
                        </div>
                      </div>
                      <FitMeter score={grant.fit.total} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className={cn("inline-flex items-center gap-1", dueTone)}>
                        <CalendarClock className="size-3" />
                        {grant.deadline} · {due >= 0 ? `${due}d left` : `${-due}d ago`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Sparkles className="size-3" />
                        {formatUsd(grant.awardMin)}–{formatUsd(grant.awardMax)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3" />
                        {grant.eligibleStates.length === 0
                          ? "Nationwide"
                          : grant.eligibleStates.join(", ")}
                      </span>
                      <StatusPill status={grant.status} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {grant.focusAreas.slice(0, 3).map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">
                          {f}
                        </Badge>
                      ))}
                    </div>
                    {selected ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunWorkflow(grant.id);
                          }}
                        >
                          <Sparkles className="mr-1.5 size-3.5" />
                          Run GrantPilot for this grant
                        </Button>
                        <a
                          href={grant.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Open RFP →
                        </a>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { Progress };
