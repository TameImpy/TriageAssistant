import { NextResponse } from "next/server";
import { listActiveTools } from "@/lib/db/catalogue";

export async function GET() {
  try {
    const tools = listActiveTools();
    return NextResponse.json(tools);
  } catch (err) {
    console.error("GET /api/catalogue error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
