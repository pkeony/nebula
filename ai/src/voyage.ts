/**
 * Voyage AI 임베딩 API 의 얇은 HTTP 클라이언트.
 *
 * 도메인 무지: Forge 의 Chunk/Citation 등을 일절 알지 못한다.
 * Nebula(다음 프로젝트) 로 그대로 복사해도 깨지지 않아야 한다.
 *
 * 호출 순서: voyage.ts ← embed.ts ← (도메인 코드들)
 *
 * Voyage 공식 API:
 *   POST https://api.voyageai.com/v1/embeddings
 *   Authorization: Bearer pa-...
 *   Body: { input: string[], model: 'voyage-code-3', input_type: 'document'|'query' }
 *   Response: { data: [{embedding: number[], index: number}], usage: { total_tokens } }
 *
 * 제약 (2026-04 기준 공시):
 *   - 한 요청 당 최대 128 input
 *   - 한 input 당 최대 32k token (코드 기준 안전하게 16k 로 자르는 것을 권장)
 *   - 한 요청 당 총합 120k token (rate limit)
 */

const VOYAGE_ENDPOINT = 'https://api.voyageai.com/v1/embeddings';

export interface VoyageEmbedRequest {
  input: string[];
  inputType: 'document' | 'query';
}

export interface VoyageEmbedResponse {
  vectors: number[][];
  totalTokens: number;
}

/**
 * 단일 HTTP 호출 — batching 은 호출자(embed.ts) 책임.
 * 실패 시 status + body 첫 500자 를 메시지에 박아서 throw.
 */
export async function voyageEmbed(
  req: VoyageEmbedRequest,
  apiKey: string,
): Promise<VoyageEmbedResponse> {
  if (req.input.length === 0) {
    return { vectors: [], totalTokens: 0 };
  }
  if (req.input.length > 128) {
    throw new Error(
      `[voyage] 한 요청 당 최대 128 input. 받은 개수: ${req.input.length}. embed.ts 에서 split 하세요.`,
    );
  }

  const res = await fetch(VOYAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: req.input,
      model: 'voyage-code-3',
      input_type: req.inputType,
    }),
  });

  if (!res.ok) {
    const errBody = (await res.text()).slice(0, 500);
    throw new Error(`[voyage] ${res.status} ${res.statusText}: ${errBody}`);
  }

  const json = (await res.json()) as {
    data: Array<{ object: string; embedding: number[]; index: number }>;
    usage: { total_tokens: number };
  };

  // index 순서대로 정렬 (Voyage 가 보장한다고는 했지만 명시적 sort 가 안전)
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return {
    vectors: sorted.map((d) => d.embedding),
    totalTokens: json.usage.total_tokens,
  };
}
