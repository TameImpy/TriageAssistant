import { NextRequest, NextResponse } from "next/server";
import { getRequest, updateRequest } from "@/lib/db/requests";
import { runOrchestratorWithTimeout } from "@/lib/agents/orchestrator";
import { createSSEStream, sseHeaders } from "@/lib/streaming/sse";
import { formatSSEEvent } from "@/lib/streaming/events";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const request = getRequest(requestId);

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.status === "in_progress") {
    return NextResponse.json(
      { error: "Triage already in progress" },
      { status: 409 }
    );
  }

  if (request.status === "complete") {
    return NextResponse.json(
      { error: "Triage already complete" },
      { status: 409 }
    );
  }

  // Mark as in_progress
  await updateRequest(requestId, { status: "in_progress" });

  const updatedRequest = getRequest(requestId)!;

  async function* orchestratorWithErrorHandling() {
    try {
      yield* runOrchestratorWithTimeout(updatedRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error during triage";
      console.error("Orchestrator error:", err);

      // Update status to error
      await updateRequest(requestId, { status: "error" });

      const encoder = new TextEncoder();
      const errorEvent = formatSSEEvent({
        type: "error",
        message,
        recoverable: false,
      });
      yield {
        type: "error" as const,
        message,
        recoverable: false,
      };
    }
  }

  const stream = createSSEStream(orchestratorWithErrorHandling());

  return new NextResponse(stream, { headers: sseHeaders() });
}
