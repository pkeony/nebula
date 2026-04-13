import type { AgentEvent } from '@/types/agent-events';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/**
 * POST /agent/run SSE 스트림 클라이언트.
 * native EventSource 는 GET 전용이므로 fetch + ReadableStream 사용.
 */
export async function streamAgentRun(
  message: string,
  onEvent: (event: AgentEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const res = await fetch(`${API_URL}/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 프레임은 \n\n 으로 구분
      const frames = buffer.split('\n\n');
      // 마지막 조각은 불완전할 수 있으므로 버퍼에 보관
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        if (!frame.trim()) continue;

        let eventData = '';

        for (const line of frame.split('\n')) {
          if (line.startsWith('data: ')) {
            eventData += line.slice(6);
          }
          // event: 라인은 무시 — data JSON 의 type 필드 사용
        }

        if (eventData) {
          const parsed = JSON.parse(eventData) as AgentEvent;
          onEvent(parsed);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
