"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";

import type {
  ScoredGrantSummary,
  WorkflowEvent,
  WorkflowStep,
} from "@/lib/grantpilot/workflow";
import type { NonprofitProfile } from "@/lib/grantpilot/types";
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

interface WorkflowRunnerProps {
  profile: NonprofitProfile;
  selectedGrantId: string | null;
  // Bumped by the parent each time the user wants to (re)run the workflow.
  runToken: number;
}

function StepRow({ step }: { step: WorkflowStep }) {
  const icon =
    step.status === "running" ? (
      <Loader2 className="size-4 animate-spin text-primary" />
    ) : step.status === "done" ? (
      <CheckCircle2 className="size-4 text-emerald-500" />
    ) : (
      <span className="size-4 rounded-full border" />
    );
  return (
    <li
      className={cn(
        "rounded-md border p-3 text-sm transition",
        step.status === "running" && "bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{step.title}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] capitalize">
          {step.status}
        </Badge>
      </div>
      {step.detail ? (
        <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {step.detail}
        </pre>
      ) : null}
    </li>
  );
}

export function WorkflowRunner({
  profile,
  selectedGrantId,
  runToken,
}: WorkflowRunnerProps) {
  const [running, setRunning] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [shortlist, setShortlist] = useState<ScoredGrantSummary[]>([]);
  const [packetMd, setPacketMd] = useState<string | null>(null);
  const [packetGrantId, setPacketGrantId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRunToken = useRef<number>(-1);

  const upsertStep = useCallback((step: WorkflowStep) => {
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
    setShortlist([]);
    setPacketMd(null);
    setPacketGrantId(null);
    setInfo(null);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    reset();
    setRunning(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/grantpilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, grantId: selectedGrantId ?? undefined }),
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
          try {
            const evt = JSON.parse(line.slice(6)) as WorkflowEvent;
            if (evt.type === "step") upsertStep(evt.step);
            else if (evt.type === "info") setInfo(evt.message);
            else if (evt.type === "error") setError(evt.message);
            else if (evt.type === "shortlist") setShortlist(evt.grants);
            else if (evt.type === "packet") {
              setPacketMd(evt.markdown);
              setPacketGrantId(evt.grantId);
            }
          } catch {
            /* ignore partial chunks */
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
  }, [profile, reset, running, selectedGrantId, upsertStep]);

  // Auto-run when parent bumps the runToken (and on initial mount).
  useEffect(() => {
    if (lastRunToken.current === runToken) return;
    lastRunToken.current = runToken;
    void run();
    // `run` itself depends on profile/grantId, but we deliberately key off
    // the parent's explicit runToken so toggling the profile doesn't
    // re-trigger an in-flight stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  const onDownloadMarkdown = () => {
    if (!packetMd || !packetGrantId) return;
    const blob = new Blob([packetMd], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packetGrantId}-grantpilot-packet.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDownloadText = () => {
    if (!packetMd || !packetGrantId) return;
    const plain = packetMd.replace(/\*\*/g, "").replace(/^#+\s+/gm, "");
    const blob = new Blob([plain], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packetGrantId}-grantpilot-packet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPrintPdf = () => {
    if (!packetMd) return;
    // Open a print-ready window. Browsers expose "Save as PDF" from the
    // print dialog, which gives us PDF export with no new dependency.
    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>GrantPilot Packet</title>
      <style>
        body { font: 14px/1.55 -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 760px; margin: 36px auto; padding: 0 16px; color: #111; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin-top: 28px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
        pre, code { white-space: pre-wrap; word-break: break-word; }
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
        em { color: #555; }
      </style></head><body>
      ${markdownToHtml(packetMd)}
      <script>setTimeout(()=>window.print(), 250);<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>GrantPilot agent</CardTitle>
            <CardDescription>
              Discover → research → outline → draft → budget → packet. Streams
              live agent steps over SSE.
            </CardDescription>
          </div>
          <Button onClick={() => run()} disabled={running} size="sm">
            {running ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Run agent
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {info ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {info}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {steps.length === 0 && !error ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 size-4 text-primary" />
            Click <strong>Run agent</strong> or pick a grant from the pipeline
            and run GrantPilot for it.
          </div>
        ) : null}

        {steps.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {steps.map((s) => (
              <StepRow key={s.id} step={s} />
            ))}
          </ol>
        ) : null}

        {shortlist.length > 0 ? (
          <div className="rounded-md border bg-card p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Top fit shortlist
            </div>
            <ol className="grid gap-1 text-sm">
              {shortlist.map((g, i) => (
                <li key={g.id} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="truncate">{g.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {g.awardRange}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {g.fit}/100
                  </Badge>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {packetMd ? (
          <div className="rounded-md border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-primary" />
                Export-ready packet
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={onDownloadMarkdown}>
                  <Download className="mr-1.5 size-3.5" />
                  .md
                </Button>
                <Button size="sm" variant="outline" onClick={onDownloadText}>
                  <Download className="mr-1.5 size-3.5" />
                  .txt
                </Button>
                <Button size="sm" variant="outline" onClick={onPrintPdf}>
                  <Download className="mr-1.5 size-3.5" />
                  PDF (print)
                </Button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-foreground">
              {packetMd}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Tiny markdown → HTML for the print preview. Handles the subset our
// packet generator emits: headings, paragraphs, lists, tables, bold, italics.
// Intentionally minimal — we don't want to ship a markdown library just for
// this print path.
function markdownToHtml(md: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inTable = false;
  let tableHead = false;

  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
      tableHead = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^#\s+/.test(line)) {
      closeList();
      closeTable();
      out.push(`<h1>${escape(line.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      closeList();
      closeTable();
      out.push(`<h2>${escape(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^###\s+/.test(line)) {
      closeList();
      closeTable();
      out.push(`<h3>${escape(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^\|/.test(line)) {
      const cells = line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
      if (/^[-: ]+$/.test(cells.join(""))) {
        // separator row marks header end
        tableHead = true;
        continue;
      }
      if (!inTable) {
        out.push("<table><thead><tr>");
        cells.forEach((c) => out.push(`<th>${formatInline(c)}</th>`));
        out.push("</tr></thead><tbody>");
        inTable = true;
      } else {
        if (tableHead) {
          out.push("<tr>");
          cells.forEach((c) => out.push(`<td>${formatInline(c)}</td>`));
          out.push("</tr>");
        } else {
          out.push("<tr>");
          cells.forEach((c) => out.push(`<th>${formatInline(c)}</th>`));
          out.push("</tr>");
        }
      }
      continue;
    } else if (inTable) {
      closeTable();
    }

    if (/^[-*]\s+/.test(line)) {
      if (inList !== "ul") {
        closeList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (line === "") {
      closeList();
      out.push("");
      continue;
    }
    closeList();
    out.push(`<p>${formatInline(line)}</p>`);
  }
  closeList();
  closeTable();
  return out.join("\n");

  function formatInline(s: string): string {
    let v = escape(s);
    v = v.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    v = v.replace(/(^|\s)\*([^*]+)\*/g, "$1<em>$2</em>");
    return v;
  }
}
