import type { AgentEvent, ErrorCode } from '@/types/agent-events';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/**
 * HTTP status → ErrorCode 매핑.
 */
function httpStatusToErrorCode(status: number): ErrorCode {
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server_error';
  if (status === 400) return 'validation';
  return 'unknown';
}

/**
 * HTTP status → 한국어 에러 메시지.
 */
function httpStatusToMessage(status: number, statusText: string): string {
  switch (status) {
    case 429: return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    case 503: return '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
    case 500: return '서버 내부 오류가 발생했습니다.';
    case 400: return '잘못된 요청입니다.';
    default: return `API 오류: ${status} ${statusText}`;
  }
}

/**
 * POST /agent/run SSE 스트림 클라이언트.
 * native EventSource 는 GET 전용이므로 fetch + ReadableStream 사용.
 */
export async function streamAgentRun(
  message: string,
  onEvent: (event: AgentEvent) => void,
  options?: { signal?: AbortSignal; conversationId?: string },
): Promise<void> {
  const body: Record<string, string> = { message };
  if (options?.conversationId) {
    body['conversationId'] = options.conversationId;
  }

  const res = await fetch(`${API_URL}/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!res.ok) {
    const code = httpStatusToErrorCode(res.status);
    const retryable = code === 'rate_limit' || code === 'server_error';
    const errorEvent: AgentEvent = {
      type: 'error',
      message: httpStatusToMessage(res.status, res.statusText),
      code,
      retryable,
    };
    onEvent(errorEvent);
    return;
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
