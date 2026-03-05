import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "@/config/agents.schema";
import type { RequestRecord } from "@/types/request";
import type { MessageRecord } from "@/types/message";
import type { AgentAnalysisResult } from "./analysis-agent";
import {
  buildRequestContext,
  buildDiscussionHistory,
  interpolatePrompt,
} from "./prompt-builder";
import type { SSEEvent } from "@/lib/streaming/events";

const client = new Anthropic();

function buildRoundPrompt(round: number, allAnalyses: AgentAnalysisResult[]): string {
  const analysisSummary = allAnalyses
    .map(
      (a) =>
        `**${a.agentName}** (Risk score: ${a.analysis.risk_score}/10)\nStance: ${a.analysis.stance}\nConcerns: ${a.analysis.concerns.join("; ")}\nQuestions for peers: ${a.analysis.questions_for_peers.join("; ") || "None"}`
    )
    .join("\n\n");

  if (round === 1) {
    return `## All Independent Analyses (Phase 2 Results)\n\n${analysisSummary}\n\n---\n\nThis is Round 1 of the structured discussion. Based on your own analysis and the analyses above:\n1. Address the key concerns raised by your peers that fall within your domain\n2. Answer any questions directed at your area of expertise\n3. Clearly state where you agree and disagree with other assessors\n4. Highlight any concerns you feel are being under-weighted\n\nBe direct, substantive, and constructive. Do not simply restate your Phase 2 analysis.`;
  }

  return `This is Round 2 — your final position. Based on the full discussion:\n1. State your definitive recommendation (APPROVE / APPROVE WITH CONDITIONS / DEFER / REJECT)\n2. List any remaining blockers or conditions that must be met\n3. Acknowledge where you have updated your view based on peer input\n4. If recommending approval, state clearly what safeguards must be in place\n\nBe conclusive. This is your final word on this request.`;
}

export async function* runDiscussionRound(
  agents: AgentConfig[],
  request: RequestRecord,
  allAnalyses: AgentAnalysisResult[],
  priorMessages: MessageRecord[],
  round: 1 | 2
): AsyncGenerator<SSEEvent> {
  // Sort agents by riskWeighting descending
  const orderedAgents = [...agents].sort(
    (a, b) => b.riskWeighting - a.riskWeighting
  );

  const requestContext = buildRequestContext(request);
  const roundPrompt = buildRoundPrompt(round, allAnalyses);

  for (const agent of orderedAgents) {
    yield {
      type: "agent_start",
      agentId: agent.id,
      agentName: agent.name,
      phase: 3,
      round,
    };

    const discussionHistory = buildDiscussionHistory(priorMessages);
    const systemPrompt = interpolatePrompt(
      agent.systemPromptTemplate,
      agent,
      requestContext,
      discussionHistory
    );

    let fullContent = "";

    try {
      const stream = client.messages.stream({
        model: agent.model,
        max_tokens: agent.maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: roundPrompt }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const token = chunk.delta.text;
          fullContent += token;
          yield { type: "agent_token", agentId: agent.id, token };
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      fullContent = `[Agent encountered an error during discussion: ${errorMsg}]`;
      yield {
        type: "agent_token",
        agentId: agent.id,
        token: fullContent,
      };
    }

    // Save message to DB and emit complete event
    const { saveMessage } = await import("@/lib/db/messages");
    const saved = saveMessage({
      request_id: request.id,
      phase: 3,
      round,
      agent_id: agent.id,
      agent_name: agent.name,
      content: fullContent,
      model_used: agent.model,
    });

    // Add to prior messages for next agent
    priorMessages.push(saved);

    yield {
      type: "agent_complete",
      agentId: agent.id,
      messageId: saved.id,
    };
  }
}
