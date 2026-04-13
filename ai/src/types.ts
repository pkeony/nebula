/**
 * 도메인-무지(domain-agnostic) 타입.
 *
 * 이 파일은 Forge 의 Chunk/Citation/Repository 같은 도메인 개념을 일절 알지 못한다.
 * Nebula(다음 프로젝트) 로 그대로 복사해도 깨지지 않는 것이 원칙.
 */

export type ModelId = 'gemini-2.5-flash' | 'gemini-3-flash-preview';

export type EmbeddingModelId = 'voyage-code-3';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RouteHint {
  questionTokens: number;
  contextTokens: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface ChatOptions {
  model: ModelId;
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /** 스트림 취소용 — 호출자(SSE 라우트)가 클라이언트 disconnect 시 abort */
  signal?: AbortSignal;
}

export interface ChatResult {
  text: string;
  usage: AiUsage;
  model: ModelId;
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: AiUsage; model: ModelId };

export interface EmbedOptions {
  inputType?: 'document' | 'query';
}

export interface EmbedResult {
  vectors: number[][];
  usage: AiUsage;
  model: EmbeddingModelId;
}
