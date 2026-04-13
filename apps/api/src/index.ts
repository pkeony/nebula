import Fastify from 'fastify';
import cors from '@fastify/cors';
import { agentRoutes } from './routes/agent.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
app.register(agentRoutes);

// 헬스체크
app.get('/health', async () => ({ status: 'ok' }));

const port = Number(process.env['PORT'] ?? 3001);
const host = process.env['HOST'] ?? '0.0.0.0';

// Graceful shutdown — MCP 서버 자식 프로세스 정리
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

await app.listen({ port, host });
