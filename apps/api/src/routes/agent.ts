import type { FastifyPluginAsync } from 'fastify';
import { McpRegistry, type ServerConfig } from '@nebula/mcp-client';
import { execute } from '@nebula/agent';
import { RunRequestSchema } from '../schemas.js';

/**
 * MCP 서버 설정 — 서버 사이드에서만 관리.
 * 클라이언트가 임의의 command 를 spawn 하는 RCE 방지.
 */
const MCP_SERVERS: ServerConfig[] = [
  {
    name: 'nebula',
    command: 'node',
    args: ['packages/mcp-server/dist/cli.js'],
  },
];

export const agentRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /agent/run — Agent 실행 + SSE 스트리밍.
   *
   * 요청 body: { message: string }
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

    const { message } = parsed.data;

    // SSE 헤더 설정
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx 프록시 버퍼링 방지
    });

    // 클라이언트 disconnect 시 abort
    const abortController = new AbortController();
    request.raw.on('close', () => abortController.abort());

    const registry = new McpRegistry();

    try {
      // MCP 서버 등록 (서버 사이드 설정만 사용)
      for (const server of MCP_SERVERS) {
        await registry.register(server);
      }

      // Agent 실행 — 이벤트 스트리밍
      for await (const event of execute(message, registry, {
        signal: abortController.signal,
      })) {
        if (abortController.signal.aborted) break;

        const data = JSON.stringify(event);
        reply.raw.write(`event: ${event.type}\ndata: ${data}\n\n`);
      }
    } catch (err) {
      const errorEvent = {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
      reply.raw.write(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`);
    } finally {
      await registry.dispose();
      reply.raw.end();
    }
  });
};
