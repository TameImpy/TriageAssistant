import { NextRequest, NextResponse } from "next/server";
import { AgentConfigSchema } from "@/config/agents.schema";
import { saveAgentConfig, loadAgents } from "@/lib/config/agent-loader";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await req.json() as unknown;

    const parsed = AgentConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid agent config", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.id !== agentId) {
      return NextResponse.json(
        { error: "Agent ID mismatch" },
        { status: 400 }
      );
    }

    saveAgentConfig(parsed.data);

    return NextResponse.json({ success: true, agent: parsed.data });
  } catch (err) {
    console.error("PATCH /api/agents/[agentId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
