import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "@/config/agents.schema";
import type { RequestRecord } from "@/types/request";
import type { AgentAnalysis } from "@/types/agent";
import { buildRequestContext, interpolatePrompt } from "./prompt-builder";

const client = new Anthropic();

const ANALYSIS_USER_PROMPT = `Based on your role and the request details above, provide your independent analysis.

Respond with valid JSON only, matching this exact schema:
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
  error?: string;
}

async function runSingleAnalysis(
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
      max_tokens: agent.maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: ANALYSIS_USER_PROMPT }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as AgentAnalysis;

    return { agentId: agent.id, agentName: agent.name, analysis };
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
