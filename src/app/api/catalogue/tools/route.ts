import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAllTools, createTool } from "@/lib/db/catalogue";

const CreateToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  vendor_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  training_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  training_notes: z.string().optional(),
});

export async function GET() {
  try {
    const tools = listAllTools();
    return NextResponse.json(tools);
  } catch (err) {
    console.error("GET /api/catalogue/tools error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = CreateToolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tool = createTool({
      name: data.name,
      description: data.description,
      category: data.category,
      vendor_url: data.vendor_url || undefined,
      training_url: data.training_url || undefined,
      training_notes: data.training_notes,
      added_by: "reviewer",
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (err) {
    console.error("POST /api/catalogue/tools error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
