import { z } from 'zod';

/**
 * Agent 실행 요청 스키마.
 *
 * mcpServers 는 클라이언트에서 받지 않음 — 서버 설정은 서버 사이드에서만 관리.
 * 클라이언트가 임의의 command 를 spawn 하는 RCE 취약점 방지.
 */
export const RunRequestSchema = z.object({
  message: z.string().min(1).max(10_000),
});

export type RunRequest = z.infer<typeof RunRequestSchema>;
