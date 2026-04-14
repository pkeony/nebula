import { describe, it, expect } from 'vitest';
import { pickModel, estimateComplexity } from './router.js';

describe('pickModel', () => {
  it('complexity high이면 gemini-2.5-flash를 선택한다', () => {
    const model = pickModel({ complexity: 'high', questionTokens: 100, contextTokens: 0 });
    expect(model).toBe('gemini-2.5-flash');
  });

  it('contextTokens > 6000이면 gemini-2.5-flash를 선택한다', () => {
    const model = pickModel({ complexity: 'low', questionTokens: 50, contextTokens: 7000 });
    expect(model).toBe('gemini-2.5-flash');
  });

  it('complexity low + 적은 contextTokens도 모델을 반환한다', () => {
    const model = pickModel({ complexity: 'low', questionTokens: 50, contextTokens: 100 });
    expect(model).toBeDefined();
    expect(typeof model).toBe('string');
  });
});

describe('estimateComplexity', () => {
  it('짧은 질문(< 60자)은 low', () => {
    expect(estimateComplexity('안녕')).toBe('low');
    expect(estimateComplexity('a'.repeat(59))).toBe('low');
  });

  it('중간 질문(60~199자)은 medium', () => {
    expect(estimateComplexity('a'.repeat(60))).toBe('medium');
    expect(estimateComplexity('a'.repeat(199))).toBe('medium');
  });

  it('긴 질문(200자 이상)은 high', () => {
    expect(estimateComplexity('a'.repeat(200))).toBe('high');
    expect(estimateComplexity('a'.repeat(1000))).toBe('high');
  });

  it('빈 문자열은 low', () => {
    expect(estimateComplexity('')).toBe('low');
  });
});
