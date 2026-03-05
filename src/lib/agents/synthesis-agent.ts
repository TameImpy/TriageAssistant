import Anthropic from "@anthropic-ai/sdk";
import type { RequestRecord } from "@/types/request";
import type { MessageRecord } from "@/types/message";
import type { AgentAnalysisResult } from "./analysis-agent";
import type { AgentConfig } from "@/config/agents.schema";
import type { FinalReport } from "@/types/report";
import { buildRequestContext } from "./prompt-builder";

const client = new Anthropic();

const SYNTHESIS_SYSTEM_PROMPT = `You are a senior decision-support analyst. Your role is to synthesise a multi-agent review discussion into a structured, actionable final report for an IT/Infosec team. You do NOT add your own opinions — you accurately represent and weigh the agents' positions.

Your output must be a valid JSON object matching the FinalReport schema exactly.`;

function buildSynthesisPrompt(
  request: RequestRecord,
  agents: AgentConfig[],
  allAnalyses: AgentAnalysisResult[],
  discussionMessages: MessageRecord[]
): string {
  const requestContext = buildRequestContext(request);

  const analysisSummary = allAnalyses
    .map((a) => {
      const agent = agents.find((ag) => ag.id === a.agentId);
      return `**${a.agentName}** (Vote weight: ${agent?.voteWeight ?? 1.0}, Risk score: ${a.analysis.risk_score}/10)
Stance: ${a.analysis.stance}
Concerns: ${a.analysis.concerns.join("; ")}`;
    })
    .join("\n\n");

  const discussionTranscript = discussionMessages
    .map((m) => `[${m.agent_name} — Round ${m.round}]\n${m.content}`)
    .join("\n\n---\n\n");

  return `Please synthesise this AI tool access request review into a final report.

## Request
${requestContext}

## Phase 2 Independent Analyses
${analysisSummary}

## Phase 3 Discussion Transcript
${discussionTranscript}

Produce a final report as JSON matching this exact schema:
{
  "recommendation": "APPROVE" | "APPROVE WITH CONDITIONS" | "DEFER" | "REJECT",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "confidence": "low" | "medium" | "high",
  "executiveSummary": "string (3-5 sentences summarising the decision rationale)",
  "requiredConditions": [
    {
      "condition": "string (specific condition that must be met)",
      "raisedBy": "string (agent name that raised this)",
      "agentId": "string (agent id)"
    }
  ],
  "riskMatrix": [
    {
      "risk": "string (risk description)",
      "severity": "low" | "medium" | "high" | "critical",
      "likelihood": "low" | "medium" | "high",
      "mitigation": "string (proposed mitigation)"
    }
  ],
  "agentPerspectives": [
    {
      "agentId": "string",
      "agentName": "string",
      "finalStance": "string (their final recommendation)",
      "keyConcerns": ["string array"],
      "riskScore": number,
      "recommendation": "string (APPROVE/REJECT/etc)"
    }
  ],
  "generatedAt": "string (ISO 8601 timestamp)"
}

Rules:
- Derive recommendation by weighting agent votes by their voteWeight
- requiredConditions should only be present if recommendation is APPROVE WITH CONDITIONS
- riskMatrix should contain 3-6 specific, actionable risks
- agentPerspectives must include one entry per agent that participated
- generatedAt should be the current timestamp`;
}

export async function runSynthesisAgent(
  request: RequestRecord,
  agents: AgentConfig[],
  allAnalyses: AgentAnalysisResult[],
  discussionMessages: MessageRecord[]
): Promise<FinalReport> {
  const prompt = buildSynthesisPrompt(
    request,
    agents,
    allAnalyses,
    discussionMessages
  );

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Synthesis agent did not return valid JSON");
  }

  const report = JSON.parse(jsonMatch[0]) as FinalReport;

  // Ensure generatedAt is set
  if (!report.generatedAt) {
    report.generatedAt = new Date().toISOString();
  }

  return report;
}
