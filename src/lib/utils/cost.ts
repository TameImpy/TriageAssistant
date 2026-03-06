const MODEL_PRICING: Record<string, { inputPerMTok: number; outputPerMTok: number }> = {
  "claude-sonnet-4-6": { inputPerMTok: 3.00,  outputPerMTok: 15.00 },
  "claude-opus-4-6":   { inputPerMTok: 15.00, outputPerMTok: 75.00 },
};

export function calculateMessageCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.inputPerMTok
       + (outputTokens / 1_000_000) * pricing.outputPerMTok;
}

export function formatCostUsd(costUsd: number): string {
  return `$${costUsd.toFixed(4)}`;
}
