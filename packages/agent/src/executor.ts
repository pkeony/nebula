import { chat } from '@nebula/ai';
import type { AiMessage, AiPart, AiUsage, ModelId } from '@nebula/ai';
import type { McpRegistry } from '@nebula/mcp-client';
import type { AgentEvent, AgentOptions } from './types.js';
import { mcpToolsToFunctionDeclarations, buildToolNameMap } from './convert-tools.js';

const DEFAULT_MODEL: ModelId = 'gemini-2.5-flash';
const DEFAULT_MAX_ITERATIONS = 10;

/**
 * Agent 실행 — think→act→observe 사이클.
 *
 * 비동기 제너레이터로 AgentEvent 를 yield 한다.
 * 호출자(API 라우트)는 이 이벤트를 SSE 로 변환해 클라이언트에 스트리밍.
 *
 * 루프:
 * 1. LLM 에 대화 + 도구 목록 전달 (THINK)
 * 2. functionCall 응답이면 도구 실행 (ACT)
 * 3. 실행 결과를 대화에 추가 (OBSERVE)
 * 4. 텍스트 응답이 나올 때까지 반복
 */
export async function* execute(
  userMessage: string,
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

  // 대화 이력 초기화
  const messages: AiMessage[] = [{ role: 'user', content: userMessage }];

  // 사용량 누적
  const totalUsage: AiUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let callId = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // AbortSignal 체크
    if (options?.signal?.aborted) {
      yield { type: 'error', message: 'Agent 실행이 취소되었습니다' };
      return;
    }

    // THINK — LLM 호출
    const result = await chat(messages, {
      model,
      system,
      maxTokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.2,
      signal: options?.signal,
      tools: functionDeclarations.length > 0 ? functionDeclarations : undefined,
      toolConfig: functionDeclarations.length > 0 ? { mode: 'auto' } : undefined,
    });

    // 사용량 누적
    totalUsage.inputTokens += result.usage.inputTokens;
    totalUsage.outputTokens += result.usage.outputTokens;
    totalUsage.costUsd += result.usage.costUsd;

    // functionCall 없음 → 최종 텍스트 응답
    if (!result.functionCalls?.length) {
      if (result.text) {
        yield { type: 'delta', text: result.text };
      }
      yield { type: 'done', usage: totalUsage, model, iterations: iteration + 1 };
      return;
    }

    // 사고 과정 텍스트가 있으면 thinking 이벤트
    if (result.text) {
      yield { type: 'thinking', content: result.text };
    }

    // ACT — 각 functionCall 실행
    const assistantParts: AiPart[] = [];
    const responseParts: AiPart[] = [];

    for (const fc of result.functionCalls) {
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
          yield { type: 'error', message: 'Agent 실행이 취소되었습니다' };
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
        resultText = err instanceof Error ? err.message : String(err);
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
  yield { type: 'error', message: `최대 반복 횟수(${maxIterations})를 초과했습니다` };
}

function buildDefaultSystem(): string {
  return [
    'You are a helpful AI agent with access to tools.',
    'Use the available tools to help answer the user\'s question.',
    'When you have enough information, provide a clear and concise answer.',
    'If a tool call fails, try an alternative approach or explain what went wrong.',
  ].join(' ');
}
