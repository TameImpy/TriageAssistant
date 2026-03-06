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

  // Only block if a clean complete run already exists
  if (request.status === "complete" && request.final_report) {
    return NextResponse.json(
      { error: "Triage already complete" },
      { status: 409 }
    );
  }

  // Reset status for stuck or errored runs so they can be retried
  await updateRequest(requestId, { status: "in_progress" });

  const updatedRequest = getRequest(requestId)!;

  async function* orchestratorWithErrorHandling() {
    try {
      yield* runOrchestratorWithTimeout(updatedRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error during triage";
      console.error("Orchestrator error:", err);
      await updateRequest(requestId, { status: "error" });
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
