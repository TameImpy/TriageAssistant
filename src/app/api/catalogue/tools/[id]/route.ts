import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTool, updateTool, deactivateTool } from "@/lib/db/catalogue";

const UpdateToolSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  vendor_url: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
  training_url: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
  training_notes: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as unknown;
    const parsed = UpdateToolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tool = getTool(id);
    if (!tool) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = parsed.data;
    const updated = updateTool(id, {
      name: data.name,
      description: data.description,
      category: data.category,
      vendor_url: data.vendor_url === "" ? null : data.vendor_url,
      training_url: data.training_url === "" ? null : data.training_url,
      training_notes: data.training_notes,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/catalogue/tools/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tool = getTool(id);
    if (!tool) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    deactivateTool(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/catalogue/tools/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
