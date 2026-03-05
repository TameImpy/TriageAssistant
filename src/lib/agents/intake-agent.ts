import Anthropic from "@anthropic-ai/sdk";
import type { RequestRecord } from "@/types/request";
import type { IntakeQuestion } from "@/types/agent";
import { buildRequestContext } from "./prompt-builder";

const client = new Anthropic();

const INTAKE_SYSTEM_PROMPT = `You are a thorough intake specialist reviewing AI tool access requests for a company's IT/Infosec team. Your job is to identify gaps in the submitted information and generate targeted follow-up questions to ensure the triage team has everything they need.

Rules:
- Generate 2–6 questions maximum
- Never ask about information already clearly provided in the submission
- Each question must have a clear rationale explaining why it matters for the review
- Focus on: security implications, data handling, business justification gaps, compliance needs
- If the submission is comprehensive, return { "ready": true } with no questions
- Questions should be answerable by the requester (not require vendor technical knowledge they may not have)`;

interface IntakeResult {
  ready: boolean;
  questions: IntakeQuestion[];
}

export async function runIntakeAgent(
  request: RequestRecord
): Promise<IntakeResult> {
  const context = buildRequestContext(request);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: INTAKE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please review this AI tool access request and determine if we have enough information to proceed with triage, or if we need clarifying questions.\n\n${context}\n\nRespond with valid JSON only, matching this schema:\n{\n  "ready": boolean,\n  "questions": [\n    {\n      "id": "string (unique, kebab-case)",\n      "question": "string (the question to ask the requester)",\n      "rationale": "string (why this question matters for the review)",\n      "answeredBy": null,\n      "required": boolean\n    }\n  ]\n}\n\nIf ready is true, questions array should be empty.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { ready: true, questions: [] };
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    ready: boolean;
    questions: IntakeQuestion[];
  };

  return {
    ready: parsed.ready ?? false,
    questions: (parsed.questions ?? []).slice(0, 6),
  };
}

export async function runIntakeReadyCheck(
  request: RequestRecord
): Promise<boolean> {
  // If we've already done 2 rounds, force ready
  const answerRounds =
    request.intake_answers && request.intake_answers.length > 0 ? 1 : 0;
  if (answerRounds >= 2) return true;

  const result = await runIntakeAgent(request);
  return result.ready;
}
