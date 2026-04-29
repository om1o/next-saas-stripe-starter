// Minimal LLM wrapper. Uses OpenAI Chat Completions when OPENAI_API_KEY is set,
// otherwise returns deterministic demo text. This avoids hard dependencies on
// the openai SDK (so build/test pass without it) while still mirroring the
// patterns used in openai-assistants-quickstart and langchainjs.

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  model?: string;
}

export function hasLLM(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function chat(
  messages: ChatMessage[],
  options: LLMOptions = {},
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return demoCompletion(messages);
  }
  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`openai ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (e) {
    return demoCompletion(messages, e instanceof Error ? e.message : undefined);
  }
}

function demoCompletion(messages: ChatMessage[], errMsg?: string): string {
  const last = messages[messages.length - 1]?.content ?? "";
  if (errMsg) {
    return `(demo fallback after LLM error: ${errMsg})\n\nBased on the available demo sources, here is a structured answer to:\n\n"${last}"\n\n- Key idea 1: outline what the question is really asking.\n- Key idea 2: list the evidence collected from the sources.\n- Key idea 3: synthesize a recommendation.\n`;
  }
  return `(demo mode — set OPENAI_API_KEY to enable real reasoning)\n\nQuestion summary: ${last.slice(0, 240)}\n\n• Plan: break the question into sub-questions and gather evidence.\n• Findings: combine the listed sources into a short synthesis.\n• Recommendation: highlight the best 1–2 actionable takeaways.`;
}

// Plan generation: returns a list of sub-queries (deterministic in demo mode).
export async function planSubQueries(
  question: string,
  n = 3,
): Promise<string[]> {
  if (!hasLLM()) {
    return demoPlan(question, n);
  }
  const text = await chat(
    [
      {
        role: "system",
        content:
          "You are a research planner. Given a user question, output a JSON array of 3-4 short, focused web search queries that together cover the question. Output JSON only, no prose.",
      },
      { role: "user", content: question },
    ],
    { temperature: 0 },
  );
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("no array");
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (
      Array.isArray(parsed) &&
      parsed.every((x) => typeof x === "string") &&
      parsed.length > 0
    ) {
      return parsed.slice(0, n);
    }
    throw new Error("bad plan shape");
  } catch {
    return demoPlan(question, n);
  }
}

function demoPlan(question: string, n: number): string[] {
  const trimmed = question.replace(/\s+/g, " ").trim();
  const variants = [
    `${trimmed} overview`,
    `${trimmed} latest developments`,
    `${trimmed} pros and cons`,
    `${trimmed} examples`,
  ];
  return variants.slice(0, n);
}
