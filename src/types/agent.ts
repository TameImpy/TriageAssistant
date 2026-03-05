export interface AgentPersona {
  title: string;
  description: string;
  avatarColor: string;
  avatarInitials: string;
}

export interface AgentStance {
  defaultBias: "risk-averse" | "neutral" | "opportunity-focused";
}

export interface AgentConfig {
  id: string;
  name: string;
  shortName: string;
  enabled: boolean;
  persona: AgentPersona;
  systemPromptTemplate: string;
  focusAreas: string[];
  riskWeighting: number;
  voteWeight: number;
  stance: AgentStance;
  requiredQuestions: string[];
  dealbreakers: string[];
  model: string;
  maxTokens: number;
}

export interface AgentAnalysis {
  summary: string;
  concerns: string[];
  questions_for_peers: string[];
  risk_score: number;
  stance: string;
}

export interface IntakeQuestion {
  id: string;
  question: string;
  rationale: string;
  answeredBy: string | null;
  required: boolean;
}

export interface IntakeAnswer {
  questionId: string;
  answer: string;
}
