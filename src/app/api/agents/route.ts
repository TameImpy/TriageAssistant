import { NextResponse } from "next/server";
import { loadAgents } from "@/lib/config/agent-loader";

export async function GET() {
  try {
    const agents = loadAgents();
    return NextResponse.json(agents);
  } catch (err) {
    console.error("GET /api/agents error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
