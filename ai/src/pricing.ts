import type { ModelId, EmbeddingModelId, AiUsage } from './types.js';

/**
 * USD per 1M tokens. 2026-04 기준 공시가.
 *
 * Gemini 2.0 Flash: input $0.10/1M, output $0.40/1M
 * Gemini 2.5 Flash: input $0.15/1M, output $0.60/1M
 * Voyage code-3: input $0.18/1M (embedding only)
 */
const PRICE_PER_M_TOKENS: Record<
  ModelId | EmbeddingModelId,
  { input: number; output: number }
> = {
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.6 }, // 프리뷰 가격 미정, 2.5-flash 동일 가정
  'voyage-code-3': { input: 0.18, output: 0 },
};

export function calculateCost(
  model: ModelId | EmbeddingModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICE_PER_M_TOKENS[model];
  if (!price) {
    throw new Error(`[ai/pricing] 미등록 모델: ${model}`);
  }
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
}

export function makeUsage(
  model: ModelId | EmbeddingModelId,
  inputTokens: number,
  outputTokens: number,
): AiUsage {
  return {
    inputTokens,
    outputTokens,
    costUsd: calculateCost(model, inputTokens, outputTokens),
  };
}
