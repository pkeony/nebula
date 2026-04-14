import { streamChat } from '@nebula/ai';
import type { AiMessage, AiPart, AiUsage, ModelId, AiFunctionCall } from '@nebula/ai';
import type { McpRegistry } from '@nebula/mcp-client';
import type { AgentEvent, AgentOptions, ErrorCode } from './types.js';
import { mcpToolsToFunctionDeclarations, buildToolNameMap } from './convert-tools.js';

const DEFAULT_MODEL: ModelId = 'gemini-2.5-flash';
const DEFAULT_MAX_ITERATIONS = 10;
const MAX_LLM_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

/** tool_result 가 이 글자 수를 넘으면 오래된 것부터 트리밍 */
const TRIM_THRESHOLD_CHARS = 50_000;
/** 트리밍 시 결과를 이 길이로 축약 */
const TRIMMED_RESULT_CHARS = 200;

/**
 * Gemini SDK 에러에서 HTTP status 추출 → ErrorCode 매핑.
 */
function classifyError(err: unknown): { code: ErrorCode; retryable: boolean } {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
    return { code: 'rate_limit', retryable: true };
  }
  if (msg.includes('503') || msg.includes('500') || msg.toLowerCase().includes('unavailable')) {
    return { code: 'server_error', retryable: true };
  }
  if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('cancel')) {
    return { code: 'aborted', retryable: false };
  }
  return { code: 'unknown', retryable: false };
}

/**
 * Agent 실행 — think→act→observe 사이클.
 *
 * 비동기 제너레이터로 AgentEvent 를 yield 한다.
 * 호출자(API 라우트)는 이 이벤트를 SSE 로 변환해 클라이언트에 스트리밍.
 *
 * streamChat() 사용으로 텍스트 delta 가 실시간 스트리밍됨.
 *
 * 루프:
 * 1. LLM 에 대화 + 도구 목록 전달 (THINK) — 스트리밍
 * 2. functionCall 응답이면 도구 실행 (ACT)
 * 3. 실행 결과를 대화에 추가 (OBSERVE)
 * 4. 텍스트 응답이 나올 때까지 반복
 */
export async function* execute(
  initialMessages: AiMessage[],
  registry: McpRegistry,
  options?: AgentOptions,
): AsyncIterable<AgentEvent> {
  const model = options?.model ?? DEFAULT_MODEL;
  const maxIterations = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const system = options?.system ?? buildDefaultSystem();

  // MCP 도구 → LLM 함수 선언 변환
  const unifiedTools = registry.listTools();
  const functionDeclarations = mcpToolsToFunctionDeclarations(unifiedTools);
  const toolNameMap = buildToolNameMap(unifiedTools);

  // 대화 이력 — 호출자가 전달한 기존 이력 복사
  const messages: AiMessage[] = [...initialMessages];

  // 사용량 누적
  const totalUsage: AiUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let callId = 0;
  let llmRetries = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 컨텍스트 윈도우 관리 — 오래된 tool_result 트리밍
    trimToolResults(messages);

    // AbortSignal 체크
    if (options?.signal?.aborted) {
      yield { type: 'error', message: 'Agent 실행이 취소되었습니다', code: 'aborted', retryable: false };
      return;
    }

    // THINK — LLM 스트리밍 호출
    let fullText = '';
    let functionCalls: AiFunctionCall[] | undefined;
    let iterationUsage: AiUsage | undefined;

    const streamLlm = () => streamChat(messages, {
      model,
      system,
      maxTokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.2,
      signal: options?.signal,
      tools: functionDeclarations.length > 0 ? functionDeclarations : undefined,
      toolConfig: functionDeclarations.length > 0 ? { mode: 'auto' } : undefined,
    });

    try {
      for await (const event of streamLlm()) {
        if (event.type === 'delta') {
          fullText += event.text;
        } else if (event.type === 'function_calls') {
          functionCalls = event.calls;
        } else if (event.type === 'done') {
          iterationUsage = event.usage;
        }
      }
    } catch (err) {
      const { code, retryable } = classifyError(err);

      // 재시도 가능한 에러 (rate_limit, server_error) → 1회 백오프 재시도
      if (retryable && llmRetries < MAX_LLM_RETRIES) {
        llmRetries++;
        yield { type: 'thinking', content: `LLM 호출 실패 (${code}), ${RETRY_DELAY_MS}ms 후 재시도...` };
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        iteration--; // 이번 iteration 재시도
        continue;
      }

      yield { type: 'error', message: err instanceof Error ? err.message : String(err), code, retryable };
      return;
    }

    // 사용량 누적
    if (iterationUsage) {
      totalUsage.inputTokens += iterationUsage.inputTokens;
      totalUsage.outputTokens += iterationUsage.outputTokens;
      totalUsage.costUsd += iterationUsage.costUsd;
    }

    // functionCall 없음 → 최종 텍스트 응답
    if (!functionCalls?.length) {
      if (fullText) {
        yield { type: 'delta', text: fullText };
      }
      yield { type: 'done', usage: totalUsage, model, iterations: iteration + 1 };
      return;
    }

    // 사고 과정 텍스트가 있으면 thinking 이벤트
    if (fullText) {
      yield { type: 'thinking', content: fullText };
    }

    // ACT — 각 functionCall 실행
    const assistantParts: AiPart[] = [];
    const responseParts: AiPart[] = [];

    for (const fc of functionCalls) {
      const id = String(++callId);
      const qualifiedName = toolNameMap.get(fc.name) ?? fc.name;

      yield { type: 'tool_call', id, tool: fc.name, args: fc.args };

      // 도구에 functionCall 파트 추가 (assistant 메시지)
      assistantParts.push({
        type: 'functionCall',
        functionCall: { name: fc.name, args: fc.args },
      });

      // 도구 실행
      let resultText: string;
      let isError = false;

      try {
        if (options?.signal?.aborted) {
          yield { type: 'error', message: 'Agent 실행이 취소되었습니다', code: 'aborted', retryable: false };
          return;
        }

        const toolResult = await registry.callTool(qualifiedName, fc.args);
        isError = toolResult.isError ?? false;
        resultText = toolResult.content
          .filter((c): c is { type: string; text: string } => typeof c.text === 'string')
          .map((c) => c.text)
          .join('\n');
      } catch (err) {
        isError = true;
        resultText = `[TOOL_ERROR] ${fc.name} 실행 실패: ${err instanceof Error ? err.message : String(err)}. 다른 도구나 접근 방식을 시도하세요.`;
      }

      yield { type: 'tool_result', id, tool: fc.name, result: resultText, isError };

      // OBSERVE — 결과를 대화에 추가 (user 메시지의 functionResponse)
      responseParts.push({
        type: 'functionResponse',
        functionResponse: {
          name: fc.name,
          response: { result: resultText, isError },
        },
      });
    }

    // 대화 이력에 assistant(functionCall) + user(functionResponse) 추가
    messages.push({ role: 'assistant', content: '', parts: assistantParts });
    messages.push({ role: 'user', content: '', parts: responseParts });
  }

  // maxIterations 초과
  yield { type: 'error', message: `최대 반복 횟수(${maxIterations})를 초과했습니다`, code: 'timeout', retryable: false };
}

/**
 * 대화 이력의 총 문자 수가 임계값을 초과하면
 * 오래된 functionResponse 결과를 축약해 토큰을 절약한다.
 * 가장 최근 2개 메시지는 보존.
 */
function trimToolResults(messages: AiMessage[]): void {
  const totalChars = messages.reduce((sum, m) => {
    if (m.parts) {
      return sum + m.parts.reduce((ps, p) => {
        if (p.type === 'functionResponse') {
          return ps + JSON.stringify(p.functionResponse.response).length;
        }
        return ps;
      }, 0);
    }
    return sum + m.content.length;
  }, 0);

  if (totalChars < TRIM_THRESHOLD_CHARS) return;

  // 오래된 메시지부터 functionResponse 결과 축약 (최근 4개 메시지 보존)
  const preserveCount = 4;
  for (let i = 0; i < messages.length - preserveCount; i++) {
    const msg = messages[i];
    if (!msg.parts) continue;

    for (const part of msg.parts) {
      if (part.type === 'functionResponse') {
        const resultStr = JSON.stringify(part.functionResponse.response);
        if (resultStr.length > TRIMMED_RESULT_CHARS) {
          part.functionResponse.response = {
            result: resultStr.slice(0, TRIMMED_RESULT_CHARS) + '... [trimmed]',
            isError: false,
          };
        }
      }
    }
  }
}

function buildDefaultSystem(): string {
  return [
    'You are a helpful AI agent with access to tools.',
    'Use the available tools to help answer the user\'s question.',
    'When you have enough information, provide a clear and concise answer.',
    'If a tool call fails, try an alternative approach or explain what went wrong.',
  ].join(' ');
}
