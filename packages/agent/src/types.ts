import type { AiUsage, ModelId } from '@nebula/ai';

/* ── Agent 이벤트 — SSE 로 클라이언트에 스트리밍 ─────────── */

export type AgentEvent =
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; id: string; tool: string; args: Record<string, unknown> }
  | { type: 'tool_result'; id: string; tool: string; result: string; isError: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: AiUsage; model: ModelId; iterations: number }
  | { type: 'error'; message: string };

/* ── Agent 실행 옵션 ────────────────────────────────────── */

export interface AgentOptions {
  model?: ModelId;
  system?: string;
  maxIterations?: number;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}
