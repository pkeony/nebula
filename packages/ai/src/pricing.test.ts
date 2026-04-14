import { describe, it, expect } from 'vitest';
import { calculateCost, makeUsage } from './pricing.js';

describe('calculateCost', () => {
  it('gemini-2.5-flash 비용을 정확히 계산한다', () => {
    // 1M input + 1M output = $0.15 + $0.60 = $0.75
    const cost = calculateCost('gemini-2.5-flash', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75);
  });

  it('gemini-3-flash-preview 비용을 정확히 계산한다', () => {
    const cost = calculateCost('gemini-3-flash-preview', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75);
  });

  it('voyage-code-3 임베딩 비용을 계산한다 (output 없음)', () => {
    // 1M input = $0.18, output 0
    const cost = calculateCost('voyage-code-3', 1_000_000, 0);
    expect(cost).toBeCloseTo(0.18);
  });

  it('토큰 0이면 비용 0', () => {
    const cost = calculateCost('gemini-2.5-flash', 0, 0);
    expect(cost).toBe(0);
  });

  it('소규모 토큰도 비례 계산', () => {
    // 1000 input tokens = $0.15 / 1000 = $0.00000015
    const cost = calculateCost('gemini-2.5-flash', 1000, 0);
    expect(cost).toBeCloseTo(0.00000015);
  });

  it('미등록 모델에 예외를 던진다', () => {
    expect(() =>
      calculateCost('unknown-model' as never, 100, 100),
    ).toThrow('미등록 모델');
  });
});

describe('makeUsage', () => {
  it('AiUsage 구조를 올바르게 생성한다', () => {
    const usage = makeUsage('gemini-2.5-flash', 500_000, 200_000);

    expect(usage).toEqual({
      inputTokens: 500_000,
      outputTokens: 200_000,
      costUsd: expect.any(Number),
    });
  });

  it('costUsd가 calculateCost 결과와 일치한다', () => {
    const usage = makeUsage('gemini-2.5-flash', 1_000_000, 1_000_000);
    expect(usage.costUsd).toBeCloseTo(0.75);
  });
});
