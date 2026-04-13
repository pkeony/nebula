/**
 * @nebula/agent AgentEvent 미러 타입.
 * 브라우저에서 Node.js 패키지 의존을 피하기 위해 복제.
 * 원본: packages/agent/src/types.ts, packages/ai/src/types.ts
 */

export type ModelId = 'gemini-2.5-flash' | 'gemini-3-flash-preview';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export type AgentEvent =
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; id: string; tool: string; args: Record<string, unknown> }
  | { type: 'tool_result'; id: string; tool: string; result: string; isError: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: AiUsage; model: ModelId; iterations: number }
  | { type: 'error'; message: string };
