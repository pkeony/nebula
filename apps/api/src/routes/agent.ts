import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { AiMessage } from '@nebula/ai';
import { McpRegistry, loadServerConfigs } from '@nebula/mcp-client';
import { execute } from '@nebula/agent';
import type { ErrorCode } from '@nebula/agent';
import { RunRequestSchema } from '../schemas.js';

/**
 * MCP 서버 설정 — mcp-servers.json 에서 로드.
 * 서버 사이드에서만 관리. 클라이언트가 임의의 command 를 spawn 하는 RCE 방지.
 */
const CONFIG_PATH = new URL('../../mcp-servers.json', import.meta.url).pathname;
const PROJECT_ROOT = new URL('../../../../', import.meta.url).pathname;

/* ── In-memory Conversation Store ──────────────────────── */

interface Conversation {
  messages: AiMessage[];
  createdAt: number;
  lastActiveAt: number;
}

const conversations = new Map<string, Conversation>();

const CONVERSATION_TTL_MS = 60 * 60 * 1000; // 1시간
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  // 5분

// TTL 만료 대화 정리
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, conv] of conversations) {
    if (now - conv.lastActiveAt > CONVERSATION_TTL_MS) {
      conversations.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref(); // 프로세스 종료 차단 방지

/* ── 라우트 ────────────────────────────────────────────── */

export const agentRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /agent/run — Agent 실행 + SSE 스트리밍.
   *
   * 요청 body: { message: string, conversationId?: string }
   * 응답: text/event-stream
   */
  app.post('/agent/run', async (request, reply) => {
    // 요청 검증
    const parsed = RunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { message, conversationId: incomingId } = parsed.data;

    // 대화 조회 또는 생성
    let conversationId: string;
    let messages: AiMessage[];

    if (incomingId && conversations.has(incomingId)) {
      conversationId = incomingId;
      const conv = conversations.get(incomingId)!;
      conv.lastActiveAt = Date.now();
      conv.messages.push({ role: 'user', content: message });
      messages = conv.messages;
    } else {
      conversationId = randomUUID();
      messages = [{ role: 'user', content: message }];
      conversations.set(conversationId, {
        messages,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    }

    // Fastify 응답 제어를 raw 소켓으로 넘김 (SSE 스트리밍)
    reply.hijack();

    // SSE 헤더 설정
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx 프록시 버퍼링 방지
      'Access-Control-Allow-Origin': '*',
    });

    // 클라이언트 disconnect 시 abort (hijack 후에는 reply.raw 사용)
    const abortController = new AbortController();
    reply.raw.on('close', () => abortController.abort());

    const registry = new McpRegistry();

    try {
      // MCP 서버 등록 (설정 파일 기반, 개별 실패 허용)
      const serverConfigs = await loadServerConfigs(CONFIG_PATH);
      for (const server of serverConfigs) {
        try {
          await registry.register({
            ...server,
            cwd: server.cwd ?? PROJECT_ROOT,
          });
          app.log.info(`MCP 서버 연결 성공: ${server.name}`);
        } catch (err) {
          app.log.warn(`MCP 서버 연결 실패 (건너뜀): ${server.name} — ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Agent 실행 — 이벤트 스트리밍 (messages 배열 전달)
      let assistantText = '';

      for await (const event of execute(messages, registry, {
        signal: abortController.signal,
      })) {
        if (abortController.signal.aborted) break;

        // done 이벤트에 conversationId 주입
        if (event.type === 'done') {
          const data = JSON.stringify({ ...event, conversationId });
          reply.raw.write(`event: ${event.type}\ndata: ${data}\n\n`);
          continue;
        }

        // delta 텍스트 누적 (대화 이력에 assistant 응답 저장용)
        if (event.type === 'delta') {
          assistantText += event.text;
        }

        const data = JSON.stringify(event);
        reply.raw.write(`event: ${event.type}\ndata: ${data}\n\n`);
      }

      // assistant 응답을 대화 이력에 추가
      if (assistantText) {
        messages.push({ role: 'assistant', content: assistantText });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const code: ErrorCode = classifyHttpError(err);
      const retryable = code === 'rate_limit' || code === 'server_error';
      const errorEvent = { type: 'error', message: errorMessage, code, retryable };
      reply.raw.write(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`);
    } finally {
      await registry.dispose();
      reply.raw.end();
    }
  });
};

function classifyHttpError(err: unknown): ErrorCode {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) return 'rate_limit';
  if (msg.includes('503') || msg.includes('500')) return 'server_error';
  return 'unknown';
}
