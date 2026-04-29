import { auth } from "@/auth";
import { runGrantWorkflow } from "@/lib/grantpilot/workflow";
import type { NonprofitProfile } from "@/lib/grantpilot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-Sent Events stream of GrantPilot workflow events. Mirrors the
// pattern used by /api/research so the client can consume both flows
// with the same parser shape.
export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  let body: { profile?: NonprofitProfile; grantId?: string };
  try {
    body = (await req.json()) as { profile?: NonprofitProfile; grantId?: string };
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!body.profile || typeof body.profile !== "object") {
    return new Response("`profile` is required", { status: 400 });
  }
  if (!body.profile.organizationName || !body.profile.state) {
    return new Response("`profile` must include organizationName and state", {
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
        for await (const event of runGrantWorkflow({
          profile: body.profile as NonprofitProfile,
          grantId: body.grantId,
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
