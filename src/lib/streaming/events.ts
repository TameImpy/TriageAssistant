import type { IntakeQuestion } from "@/types/agent";
import type { FinalReport } from "@/types/report";

export type SSEEvent =
  | { type: "phase_start"; phase: 1 | 2 | 3 | 4; label: string }
  | {
      type: "agent_start";
      agentId: string;
      agentName: string;
      phase: number;
      round?: number;
    }
  | { type: "agent_token"; agentId: string; token: string }
  | {
      type: "agent_complete";
      agentId: string;
      messageId: string;
      structuredData?: unknown;
    }
  | { type: "phase_complete"; phase: number }
  | { type: "report_ready"; report: FinalReport }
  | { type: "error"; message: string; recoverable: boolean }
  | { type: "needs_clarification"; questions: IntakeQuestion[] };

export function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
