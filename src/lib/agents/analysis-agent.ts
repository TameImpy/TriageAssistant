import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "@/config/agents.schema";
import type { RequestRecord } from "@/types/request";
import type { AgentAnalysis } from "@/types/agent";
import { buildRequestContext, interpolatePrompt } from "./prompt-builder";

const client = new Anthropic();

const WEB_SEARCH_AGENT_IDS = new Set(["infosec", "legal"]);

const ANALYSIS_USER_PROMPT = `Based on your role and the request details above, provide your independent analysis.

{{searchInstructions}}

Respond with valid JSON only, matching this exact schema:
{
  "summary": "string (2-3 sentence overview of your assessment)",
  "concerns": ["string array of specific concerns you have"],
  "questions_for_peers": ["string array of questions you want other reviewers to address"],
  "risk_score": number (1-10, where 10 is highest risk),
  "stance": "string (one of: APPROVE | APPROVE_WITH_CONDITIONS | DEFER | REJECT, followed by a brief reason)"
}`;

const SEARCH_INSTRUCTIONS = `You have access to a web search tool. Use it (2 searches max) to look up publicly available information about the vendor relevant to your focus areas — e.g. privacy policy, security certifications, data training practices, or known incidents. Only search if it would materially affect your assessment.`;

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

  const useWebSearch = WEB_SEARCH_AGENT_IDS.has(agent.id);
  const userPrompt = ANALYSIS_USER_PROMPT.replace(
    "{{searchInstructions}}",
    useWebSearch ? SEARCH_INSTRUCTIONS : ""
  ).trim();

  try {
    const createParams: Anthropic.MessageCreateParamsNonStreaming = {
      model: agent.model,
      max_tokens: agent.maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };

    if (useWebSearch) {
      createParams.tools = [{ type: "web_search_20250305" as const, name: "web_search" }];
    }

    let response = await client.messages.create(createParams);

    // Agentic loop for web search tool use
    if (useWebSearch) {
      const messages: Anthropic.MessageParam[] = [
        { role: "user", content: userPrompt },
      ];

      while (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Search completed.",
        }));

        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: toolResults });

        response = await client.messages.create({
          ...createParams,
          messages,
        });
      }
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

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
