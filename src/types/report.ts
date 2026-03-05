import type { Recommendation, RiskLevel } from "./request";

export interface RiskItem {
  risk: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  mitigation: string;
}

export interface RequiredCondition {
  condition: string;
  raisedBy: string;
  agentId: string;
}

export interface AgentPerspective {
  agentId: string;
  agentName: string;
  finalStance: string;
  keyConcerns: string[];
  riskScore: number;
  recommendation: string;
}

export interface FinalReport {
  recommendation: Recommendation;
  riskLevel: RiskLevel;
  confidence: "low" | "medium" | "high";
  executiveSummary: string;
  requiredConditions: RequiredCondition[];
  riskMatrix: RiskItem[];
  agentPerspectives: AgentPerspective[];
  generatedAt: string;
}
