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
  /** 멀티턴 도구 대화 시 사용. 있으면 content 보다 우선 */
  parts?: AiPart[];
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
  /** Agent loop 용 — LLM 에 전달할 함수 선언 목록 */
  tools?: AiFunctionDeclaration[];
  /** 함수 호출 모드 — auto: LLM 판단, any: 반드시 호출, none: 호출 금지 */
  toolConfig?: { mode: 'auto' | 'any' | 'none' };
}

export interface ChatResult {
  text: string;
  usage: AiUsage;
  model: ModelId;
  /** LLM 이 함수 호출을 요청한 경우 — 없으면 텍스트 응답 */
  functionCalls?: AiFunctionCall[];
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: AiUsage; model: ModelId };

/* ── Function Calling (Agent Loop 지원) ────────────────────── */

/** 도메인-무지 함수 선언 — MCP Tool 에서 변환되어 LLM 에 전달 */
export interface AiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** LLM 이 반환한 함수 호출 요청 */
export interface AiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

/** 함수 실행 결과를 LLM 에 전달하기 위한 응답 */
export interface AiFunctionResponse {
  name: string;
  response: Record<string, unknown>;
}

/** 멀티턴 도구 대화를 위한 메시지 파트 */
export type AiPart =
  | { type: 'text'; text: string }
  | { type: 'functionCall'; functionCall: AiFunctionCall }
  | { type: 'functionResponse'; functionResponse: AiFunctionResponse };

/* ── ─────────────────────────────────────────────────────── */

export interface EmbedOptions {
  inputType?: 'document' | 'query';
}

export interface EmbedResult {
  vectors: number[][];
  usage: AiUsage;
  model: EmbeddingModelId;
}
