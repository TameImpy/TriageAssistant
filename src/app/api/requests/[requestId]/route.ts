import { NextRequest, NextResponse } from "next/server";
import { getRequest } from "@/lib/db/requests";
import { getMessagesByRequest } from "@/lib/db/messages";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const request = getRequest(requestId);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const messages = getMessagesByRequest(requestId);

    return NextResponse.json({ ...request, messages });
  } catch (err) {
    console.error("GET /api/requests/[requestId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
