import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequest, updateRequest } from "@/lib/db/requests";
import { runIntakeAgent } from "@/lib/agents/intake-agent";
import type { IntakeAnswer } from "@/types/agent";

const IntakeRequestSchema = z.object({
  requestId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = IntakeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requestId, answers } = parsed.data;
    const request = getRequest(requestId);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // If answers are being submitted, this is the clarification round completing.
    // Always mark ready after one round — no second loop.
    if (answers && answers.length > 0) {
      const existingAnswers: IntakeAnswer[] = request.intake_answers ?? [];
      await updateRequest(requestId, {
        intake_answers: [...existingAnswers, ...answers],
        intake_ready: true,
        status: "in_progress",
      });
      return NextResponse.json({ ready: true, questions: [] });
    }

    // Initial submission — run the intake agent to decide if questions are needed
    const result = await runIntakeAgent(request);

    if (result.ready || result.questions.length === 0) {
      await updateRequest(requestId, {
        intake_ready: true,
        status: "in_progress",
      });
      return NextResponse.json({ ready: true, questions: [] });
    }

    // First (and only) round of questions
    await updateRequest(requestId, {
      intake_questions: result.questions,
      status: "awaiting_clarification",
    });

    return NextResponse.json({ ready: false, questions: result.questions });
  } catch (err) {
    console.error("POST /api/intake error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
