import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "@/config/agents.schema";
import type { RequestRecord } from "@/types/request";
import type { AgentAnalysis } from "@/types/agent";
import { buildRequestContext, interpolatePrompt } from "./prompt-builder";

const client = new Anthropic();

// Minimum tokens reserved for the JSON output — overrides per-agent config if lower
const MIN_ANALYSIS_TOKENS = 2048;

const ANALYSIS_USER_PROMPT = `Based on your role and the request details above, provide your independent analysis.

Output ONLY a single valid JSON object — no markdown, no code fences, no text before or after. The JSON must match this exact schema:
{
  "summary": "string (2-3 sentence overview of your assessment)",
  "concerns": ["string array of specific concerns you have"],
  "questions_for_peers": ["string array of questions you want other reviewers to address"],
  "risk_score": number (1-10, where 10 is highest risk),
  "stance": "string (one of: APPROVE | APPROVE_WITH_CONDITIONS | DEFER | REJECT, followed by a brief reason)"
}`;

export interface AgentAnalysisResult {
  agentId: string;
  agentName: string;
  analysis: AgentAnalysis;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

function extractJson(text: string): string | null {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) return fenced[1];
  // Bare JSON object — match from first { to last }
  const bare = text.match(/\{[\s\S]*\}/);
  if (bare) return bare[0];
  return null;
}

export async function runSingleAnalysis(
  agent: AgentConfig,
  request: RequestRecord
): Promise<AgentAnalysisResult> {
  const requestContext = buildRequestContext(request);
  const systemPrompt = interpolatePrompt(
    agent.systemPromptTemplate,
    agent,
    requestContext,
    ""
  );

  try {
    const response = await client.messages.create({
      model: agent.model,
      max_tokens: Math.max(agent.maxTokens, MIN_ANALYSIS_TOKENS),
      system: systemPrompt,
      messages: [{ role: "user", content: ANALYSIS_USER_PROMPT }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonStr = extractJson(text);
    if (!jsonStr) {
      throw new Error(`No JSON found in response. Raw text (first 200 chars): ${text.slice(0, 200)}`);
    }

    const analysis = JSON.parse(jsonStr) as AgentAnalysis;
    return {
      agentId: agent.id,
      agentName: agent.name,
      analysis,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      agentId: agent.id,
      agentName: agent.name,
      analysis: {
        summary: `Analysis unavailable: ${errorMessage}`,
        concerns: ["Agent encountered an error during analysis"],
        questions_for_peers: [],
        risk_score: 5,
        stance: "DEFER — Agent unavailable",
      },
      inputTokens: 0,
      outputTokens: 0,
      error: errorMessage,
    };
  }
}

export async function runParallelAnalysis(
  agents: AgentConfig[],
  request: RequestRecord
): Promise<AgentAnalysisResult[]> {
  return Promise.all(agents.map((agent) => runSingleAnalysis(agent, request)));
}
