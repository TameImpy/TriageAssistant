import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequest, listRequests } from "@/lib/db/requests";

const CreateRequestSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  tool_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  requester_name: z.string().min(1, "Your name is required"),
  requester_team: z.string().min(1, "Team is required"),
  requester_role: z.string().optional(),
  business_justification: z
    .string()
    .min(100, "Please provide at least 100 characters of justification"),
  data_types: z
    .array(z.string())
    .min(1, "Select at least one data type"),
  user_count: z.string().min(1, "User count is required"),
  data_leaves_company: z.boolean().nullable().optional(),
  requires_system_access: z.enum(["yes", "no", "unsure"]).optional(),
  estimated_cost: z.string().optional(),
  replaces_tool: z.string().optional(),
  existing_docs_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = CreateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const requires_system_access =
      data.requires_system_access === "yes"
        ? true
        : data.requires_system_access === "no"
        ? false
        : null;
    const record = createRequest({
      ...data,
      tool_url: data.tool_url || undefined,
      existing_docs_url: data.existing_docs_url || undefined,
      requires_system_access,
    });

    return NextResponse.json({ id: record.id, status: record.status }, { status: 201 });
  } catch (err) {
    console.error("POST /api/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requests = listRequests();
    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        tool_name: r.tool_name,
        requester_name: r.requester_name,
        requester_team: r.requester_team,
        status: r.status,
        risk_level: r.risk_level,
        recommendation: r.recommendation,
        created_at: r.created_at,
        intake_ready: r.intake_ready,
        requires_system_access: r.requires_system_access,
        total_cost_usd: r.total_cost_usd,
      }))
    );
  } catch (err) {
    console.error("GET /api/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
