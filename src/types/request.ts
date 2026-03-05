import type { IntakeAnswer, IntakeQuestion } from "./agent";

export type RequestStatus =
  | "draft"
  | "awaiting_clarification"
  | "in_progress"
  | "complete"
  | "error";

export type Recommendation =
  | "APPROVE"
  | "APPROVE WITH CONDITIONS"
  | "DEFER"
  | "REJECT";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RequestRecord {
  id: string;
  created_at: number;
  updated_at: number;
  status: RequestStatus;
  tool_name: string;
  tool_url: string | null;
  requester_name: string;
  requester_team: string;
  requester_role: string | null;
  business_justification: string;
  data_types: string[];
  user_count: string;
  data_leaves_company: boolean | null;
  estimated_cost: string | null;
  replaces_tool: string | null;
  existing_docs_url: string | null;
  intake_questions: IntakeQuestion[] | null;
  intake_answers: IntakeAnswer[] | null;
  intake_ready: boolean;
  final_report: string | null;
  recommendation: Recommendation | null;
  risk_level: RiskLevel | null;
  agents_config_snapshot: string | null;
}

export interface CreateRequestInput {
  tool_name: string;
  tool_url?: string;
  requester_name: string;
  requester_team: string;
  requester_role?: string;
  business_justification: string;
  data_types: string[];
  user_count: string;
  data_leaves_company?: boolean | null;
  estimated_cost?: string;
  replaces_tool?: string;
  existing_docs_url?: string;
}
