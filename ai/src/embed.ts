import { parseEnv } from './env.js';
import { makeUsage } from './pricing.js';
import { voyageEmbed } from './voyage.js';
import type { EmbedOptions, EmbedResult } from './types.js';

/**
 * Voyage code-3 임베딩 — 도메인 무지 래퍼.
 *
 * 호출자는 batching 을 신경쓰지 않는다. 입력이 몇 개든 알아서:
 *   1. ≤128 input/요청 으로 split
 *   2. 합계 ≤100k token/요청 안에 들도록 보수적으로 추가 split (대략 추정)
 *   3. CONCURRENCY 개 동시 호출 (순차 대비 ~3x 빠름)
 *   4. 결과 벡터를 입력 순서대로 합쳐서 반환
 *
 * 비용은 packages/ai/pricing.ts 의 voyage-code-3 가격으로 계산.
 */

/** 동시 API 요청 수 — Voyage rate limit 안에서 최대 효율 */
const CONCURRENCY = 4;

/** 한 요청 당 최대 input 개수 (Voyage 공시) */
const MAX_INPUTS_PER_REQUEST = 32;

/**
 * 한 요청 당 보수적인 토큰 예산.
 * Voyage 공시 한도(120k). char÷4 추정이 부정확하므로 (코드에 특수문자 많음)
 * 60K 로 설정해서 실제 토큰이 120K 를 절대 넘지 않게.
 */
const TOKEN_BUDGET_PER_REQUEST = 30_000;
const CHARS_PER_TOKEN_ESTIMATE = 4;

export async function embed(
  inputs: string[],
  opts: EmbedOptions = {},
): Promise<EmbedResult> {
  if (inputs.length === 0) {
    return {
      vectors: [],
      usage: makeUsage('voyage-code-3', 0, 0),
      model: 'voyage-code-3',
    };
  }

  const env = parseEnv();
  const inputType = opts.inputType ?? 'document';

  const batches = splitIntoBatches(inputs);

  // 동시 CONCURRENCY 개씩 병렬 실행 (순서 보존)
  const results: { vectors: number[][]; totalTokens: number }[] = new Array(batches.length);

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const window = batches.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      window.map((batch, j) =>
        voyageEmbed({ input: batch, inputType }, env.VOYAGE_API_KEY).then((res) => {
          results[i + j] = { vectors: res.vectors, totalTokens: res.totalTokens };
        }),
      ),
    );
  }

  const allVectors: number[][] = [];
  let totalTokens = 0;
  for (const r of results) {
    if (r) {
      allVectors.push(...r.vectors);
      totalTokens += r.totalTokens;
    }
  }

  return {
    vectors: allVectors,
    usage: makeUsage('voyage-code-3', totalTokens, 0),
    model: 'voyage-code-3',
  };
}

/**
 * inputs 을 (a) 개수 ≤128, (b) 추정 토큰 ≤100k 두 조건 모두 만족하는 배치로 분할.
 * 입력 순서는 그대로 유지.
 */
function splitIntoBatches(inputs: string[]): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const input of inputs) {
    const estTokens = Math.ceil(input.length / CHARS_PER_TOKEN_ESTIMATE);
    const wouldExceedCount = current.length + 1 > MAX_INPUTS_PER_REQUEST;
    const wouldExceedTokens = currentTokens + estTokens > TOKEN_BUDGET_PER_REQUEST;

    if (current.length > 0 && (wouldExceedCount || wouldExceedTokens)) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }

    current.push(input);
    currentTokens += estTokens;
  }

  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}
