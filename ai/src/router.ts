import type { ModelId, RouteHint } from './types.js';

/**
 * Gemini 모델 자동 라우팅.
 *
 * 기본: gemini-2.0-flash (가장 저렴, $0.10/1M input)
 * 복잡한 질문: gemini-2.5-flash (약간 비싸지만 추론 능력 향상)
 */
export function pickModel(hint: RouteHint): ModelId {
  if (hint.complexity === 'high') return 'gemini-2.5-flash';
  if (hint.contextTokens > 6000) return 'gemini-2.5-flash';
  return 'gemini-2.5-flash';
}

/** 매우 단순 휴리스틱 — 추후 LLM-classifier 로 교체 가능 */
export function estimateComplexity(question: string): RouteHint['complexity'] {
  const len = question.length;
  if (len < 60) return 'low';
  if (len < 200) return 'medium';
  return 'high';
}
