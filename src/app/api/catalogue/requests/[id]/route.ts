import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCatalogueRequest, resolveCatalogueRequest } from "@/lib/db/catalogue";

const ResolveSchema = z.object({
  status: z.enum(["approved", "denied"]),
  reviewer_note: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = getCatalogueRequest(id);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (err) {
    console.error("GET /api/catalogue/requests/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as unknown;
    const parsed = ResolveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const record = getCatalogueRequest(id);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = resolveCatalogueRequest(id, parsed.data.status, parsed.data.reviewer_note);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/catalogue/requests/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
