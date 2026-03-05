import type { RequestRecord } from "@/types/request";
import type { SSEEvent } from "@/lib/streaming/events";
import type { MessageRecord } from "@/types/message";
import { loadEnabledAgents } from "@/lib/config/agent-loader";
import { runParallelAnalysis } from "./analysis-agent";
import { runDiscussionRound } from "./discussion-agent";
import { runSynthesisAgent } from "./synthesis-agent";
import { saveMessage } from "@/lib/db/messages";
import { updateRequest } from "@/lib/db/requests";

const TRIAGE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export async function* runOrchestrator(
  request: RequestRecord
): AsyncGenerator<SSEEvent> {
  const agents = loadEnabledAgents();
  const discussionMessages: MessageRecord[] = [];

  // Store config snapshot
  await updateRequest(request.id, {
    agents_config_snapshot: JSON.stringify(agents),
  });

  // --- PHASE 2: Independent Analysis ---
  yield { type: "phase_start", phase: 2, label: "Independent Analysis" };

  // Emit agent_start for each agent (analysis is parallel, not streaming)
  for (const agent of agents) {
    yield {
      type: "agent_start",
      agentId: agent.id,
      agentName: agent.name,
      phase: 2,
    };
  }

  const allAnalyses = await runParallelAnalysis(agents, request);

  // Save analysis messages and emit complete events
  for (const result of allAnalyses) {
    const saved = saveMessage({
      request_id: request.id,
      phase: 2,
      agent_id: result.agentId,
      agent_name: result.agentName,
      content: result.analysis.summary,
      structured_data: result.analysis,
      model_used: agents.find((a) => a.id === result.agentId)?.model ?? null,
    });

    yield {
      type: "agent_complete",
      agentId: result.agentId,
      messageId: saved.id,
      structuredData: result.analysis,
    };
  }

  yield { type: "phase_complete", phase: 2 };

  // --- PHASE 3: Structured Discussion ---
  yield { type: "phase_start", phase: 3, label: "Structured Discussion" };

  // Round 1
  for await (const event of runDiscussionRound(
    agents,
    request,
    allAnalyses,
    discussionMessages,
    1
  )) {
    yield event;
    // Track messages added during discussion
    if (event.type === "agent_complete") {
      // Messages are already saved in runDiscussionRound; rebuild from DB
      const { getMessagesByRequest } = await import("@/lib/db/messages");
      const allMsgs = getMessagesByRequest(request.id);
      // Update discussionMessages with phase 3 messages only
      const phase3Msgs = allMsgs.filter((m) => m.phase === 3);
      discussionMessages.splice(0, discussionMessages.length, ...phase3Msgs);
    }
  }

  // Round 2
  for await (const event of runDiscussionRound(
    agents,
    request,
    allAnalyses,
    discussionMessages,
    2
  )) {
    yield event;
    if (event.type === "agent_complete") {
      const { getMessagesByRequest } = await import("@/lib/db/messages");
      const allMsgs = getMessagesByRequest(request.id);
      const phase3Msgs = allMsgs.filter((m) => m.phase === 3);
      discussionMessages.splice(0, discussionMessages.length, ...phase3Msgs);
    }
  }

  yield { type: "phase_complete", phase: 3 };

  // --- PHASE 4: Synthesis ---
  yield { type: "phase_start", phase: 4, label: "Generating Final Report" };

  yield {
    type: "agent_start",
    agentId: "synthesis",
    agentName: "Synthesis Agent",
    phase: 4,
  };

  const { getMessagesByRequest } = await import("@/lib/db/messages");
  const finalDiscussionMessages = getMessagesByRequest(request.id).filter(
    (m) => m.phase === 3
  );

  const report = await runSynthesisAgent(
    request,
    agents,
    allAnalyses,
    finalDiscussionMessages
  );

  // Save synthesis message
  const synthesisSaved = saveMessage({
    request_id: request.id,
    phase: 4,
    agent_id: "synthesis",
    agent_name: "Synthesis Agent",
    content: report.executiveSummary,
    model_used: "claude-opus-4-6",
  });

  yield {
    type: "agent_complete",
    agentId: "synthesis",
    messageId: synthesisSaved.id,
  };

  // Update request with final report
  await updateRequest(request.id, {
    status: "complete",
    final_report: report,
    recommendation: report.recommendation,
    risk_level: report.riskLevel,
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
