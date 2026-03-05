import { z } from "zod";

export const AgentPersonaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  avatarColor: z.string().min(1),
  avatarInitials: z.string().min(1).max(3),
});

export const AgentStanceSchema = z.object({
  defaultBias: z.enum(["risk-averse", "neutral", "opportunity-focused"]),
});

export const AgentConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  enabled: z.boolean(),
  persona: AgentPersonaSchema,
  systemPromptTemplate: z.string().min(1),
  focusAreas: z.array(z.string()),
  riskWeighting: z.number().int().min(1).max(10),
  voteWeight: z.number().min(0),
  stance: AgentStanceSchema,
  requiredQuestions: z.array(z.string()),
  dealbreakers: z.array(z.string()),
  model: z.string().min(1),
  maxTokens: z.number().int().positive(),
});

export const AgentsConfigSchema = z.array(AgentConfigSchema);

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
