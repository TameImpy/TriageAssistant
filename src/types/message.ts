import type { AgentAnalysis } from "./agent";

export interface MessageRecord {
  id: string;
  request_id: string;
  created_at: number;
  phase: 1 | 2 | 3 | 4;
  round: number | null;
  agent_id: string;
  agent_name: string;
  content: string;
  structured_data: AgentAnalysis | null;
  token_count: number | null;
  model_used: string | null;
}

export interface SaveMessageInput {
  request_id: string;
  phase: 1 | 2 | 3 | 4;
  round?: number | null;
  agent_id: string;
  agent_name: string;
  content: string;
  structured_data?: AgentAnalysis | null;
  token_count?: number | null;
  model_used?: string | null;
}
