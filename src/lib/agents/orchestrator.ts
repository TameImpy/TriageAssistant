import type { RequestRecord } from "@/types/request";
import type { SSEEvent } from "@/lib/streaming/events";
import { loadEnabledAgents } from "@/lib/config/agent-loader";
import { runSingleAnalysis, type AgentAnalysisResult } from "./analysis-agent";
import { runSynthesisAgent } from "./synthesis-agent";
import { saveMessage } from "@/lib/db/messages";
import { updateRequest } from "@/lib/db/requests";
import { calculateMessageCost } from "@/lib/utils/cost";

const TRIAGE_TIMEOUT_MS = 3 * 60 * 1000;

export async function* runOrchestrator(
  request: RequestRecord
): AsyncGenerator<SSEEvent> {
  const agents = loadEnabledAgents();

  await updateRequest(request.id, {
    agents_config_snapshot: JSON.stringify(agents),
  });

  // --- PHASE 2: Independent Analysis ---
  yield { type: "phase_start", phase: 2, label: "Independent Analysis" };

  const allAnalyses: AgentAnalysisResult[] = [];
  let totalCostUsd = 0;

  for (const agent of agents) {
    yield {
      type: "agent_start",
      agentId: agent.id,
      agentName: agent.name,
      phase: 2,
    };

    const result = await runSingleAnalysis(agent, request);
    allAnalyses.push(result);
    totalCostUsd += calculateMessageCost(agent.model, result.inputTokens, result.outputTokens);

    const saved = saveMessage({
      request_id: request.id,
      phase: 2,
      agent_id: result.agentId,
      agent_name: result.agentName,
      content: result.analysis.summary,
      structured_data: result.analysis,
      model_used: agent.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
    });

    yield {
      type: "agent_complete",
      agentId: result.agentId,
      messageId: saved.id,
      structuredData: result.analysis,
    };

    await new Promise((r) => setTimeout(r, 400));
  }

  yield { type: "phase_complete", phase: 2 };

  // --- PHASE 4: Synthesis (directly from Phase 2 analyses) ---
  yield { type: "phase_start", phase: 4, label: "Generating Final Report" };

  yield {
    type: "agent_start",
    agentId: "synthesis",
    agentName: "Synthesis Agent",
    phase: 4,
  };

  const { report, inputTokens: synthIn, outputTokens: synthOut } =
    await runSynthesisAgent(request, agents, allAnalyses);
  totalCostUsd += calculateMessageCost("claude-opus-4-6", synthIn, synthOut);

  const synthesisSaved = saveMessage({
    request_id: request.id,
    phase: 4,
    agent_id: "synthesis",
    agent_name: "Synthesis Agent",
    content: report.executiveSummary,
    model_used: "claude-opus-4-6",
    input_tokens: synthIn,
    output_tokens: synthOut,
  });

  yield {
    type: "agent_complete",
    agentId: "synthesis",
    messageId: synthesisSaved.id,
  };

  await updateRequest(request.id, {
    status: "complete",
    final_report: report,
    recommendation: report.recommendation,
    risk_level: report.riskLevel,
    total_cost_usd: totalCostUsd,
  });

  yield { type: "phase_complete", phase: 4 };
  yield { type: "report_ready", report };
}

export async function* runOrchestratorWithTimeout(
  request: RequestRecord
): AsyncGenerator<SSEEvent> {
  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
  }, TRIAGE_TIMEOUT_MS);

  try {
    for await (const event of runOrchestrator(request)) {
      if (timedOut) {
        yield {
          type: "error",
          message: "Triage timed out after 3 minutes",
          recoverable: false,
        };
        return;
      }
      yield event;
    }
  } finally {
    clearTimeout(timeoutHandle);
  }
}
