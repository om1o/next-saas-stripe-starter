import { auth } from "@/auth";
import { runResearch } from "@/lib/agents/research";
import { ResearchRequest } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-Sent Events stream of agent events. Pattern inspired by
// openai-assistants-quickstart's streaming endpoint and langchainjs's
// streamed step events.
export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  let body: ResearchRequest;
  try {
    body = (await req.json()) as ResearchRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!body || typeof body.question !== "string" || !body.question.trim()) {
    return new Response("`question` is required", { status: 400 });
  }
  if (body.question.length > 1000) {
    return new Response("`question` is too long (max 1000 chars)", {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };
      try {
        for await (const event of runResearch({
          question: body.question,
          mode: body.mode === "deep" ? "deep" : "fast",
        })) {
          send(event);
        }
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "unknown error",
        });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
