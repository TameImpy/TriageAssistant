import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCatalogueRequest, listCatalogueRequests, getTool } from "@/lib/db/catalogue";

const CreateCatalogueRequestSchema = z.object({
  tool_id: z.string().min(1),
  requester_name: z.string().min(1, "Your name is required"),
  requester_team: z.string().min(1, "Team is required"),
  requester_role: z.string().optional(),
  business_reason: z.string().min(20, "Please provide at least 20 characters"),
  user_count: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = CreateCatalogueRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tool = getTool(data.tool_id);

    if (!tool || !tool.active) {
      return NextResponse.json({ error: "Tool not found or not active" }, { status: 400 });
    }

    const record = createCatalogueRequest({
      tool_id: data.tool_id,
      tool_name: tool.name,
      requester_name: data.requester_name,
      requester_team: data.requester_team,
      requester_role: data.requester_role,
      business_reason: data.business_reason,
      user_count: data.user_count,
    });

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/catalogue/requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const requests = listCatalogueRequests();
    return NextResponse.json(requests);
  } catch (err) {
    console.error("GET /api/catalogue/requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
