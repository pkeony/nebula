import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type Content,
  type Part,
  type FunctionDeclaration,
  type FunctionDeclarationSchema,
  type Tool as GeminiTool,
  type ToolConfig as GeminiToolConfig,
} from '@google/generative-ai';
import { parseEnv } from '@nebula/shared/env';
import { makeUsage } from './pricing.js';
import type {
  AiMessage,
  AiPart,
  AiFunctionDeclaration,
  AiFunctionCall,
  ChatOptions,
  ChatResult,
  StreamEvent,
  StreamChatEvent,
} from './types.js';

/**
 * Gemini 게이트웨이 — 도메인 무지.
 *
 * 외부로는 {delta, done} 이벤트만 yield 하고, SSE 변환은 호출자(apps/api) 책임.
 * Gemini SDK 의 streaming chunks 에서 text 를 추출해 흘려보낸다.
 * usage/cost 계산은 packages/ai/pricing.ts 한 곳에서.
 */

let _client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!_client) {
    _client = new GoogleGenerativeAI(parseEnv().GOOGLE_API_KEY);
  }
  return _client;
}

/* ── AiMessage → Gemini Content 변환 ─────────────────────── */

function aiPartToGeminiPart(part: AiPart): Part {
  switch (part.type) {
    case 'text':
      return { text: part.text };
    case 'functionCall':
      return { functionCall: { name: part.functionCall.name, args: part.functionCall.args } };
    case 'functionResponse':
      return {
        functionResponse: {
          name: part.functionResponse.name,
          response: part.functionResponse.response,
        },
      };
  }
}

function toGeminiContents(messages: AiMessage[]): Content[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: m.parts
        ? m.parts.map(aiPartToGeminiPart)
        : [{ text: m.content }],
    }));
}

/* ── AiFunctionDeclaration → Gemini FunctionDeclaration ──── */

function toGeminiFD(decl: AiFunctionDeclaration): FunctionDeclaration {
  const fd: FunctionDeclaration = {
    name: decl.name,
    description: decl.description,
  };

  if (decl.parameters?.properties) {
    fd.parameters = {
      type: SchemaType.OBJECT,
      properties: decl.parameters.properties as FunctionDeclarationSchema['properties'],
      required: decl.parameters.required,
    };
  }

  return fd;
}

const FUNCTION_CALLING_MODE_MAP: Record<string, FunctionCallingMode> = {
  auto: FunctionCallingMode.AUTO,
  any: FunctionCallingMode.ANY,
  none: FunctionCallingMode.NONE,
};

function buildToolArgs(opts: ChatOptions): {
  tools?: GeminiTool[];
  toolConfig?: GeminiToolConfig;
} {
  if (!opts.tools?.length) return {};

  const tools: GeminiTool[] = [{ functionDeclarations: opts.tools.map(toGeminiFD) }];

  const toolConfig: GeminiToolConfig | undefined = opts.toolConfig
    ? { functionCallingConfig: { mode: FUNCTION_CALLING_MODE_MAP[opts.toolConfig.mode] } }
    : undefined;

  return { tools, toolConfig };
}

/* ── 응답에서 FunctionCall 추출 ─────────────────────────── */

function extractFunctionCalls(
  responseFn: () => import('@google/generative-ai').FunctionCall[] | undefined,
): AiFunctionCall[] | undefined {
  const calls = responseFn();
  if (!calls?.length) return undefined;

  return calls.map((c) => ({
    name: c.name,
    args: (c.args ?? {}) as Record<string, unknown>,
  }));
}

/* ── Public API ─────────────────────────────────────────── */

/**
 * 비-스트리밍 chat. Agent loop 에서 tool calling 과 함께 사용.
 */
export async function chat(messages: AiMessage[], opts: ChatOptions): Promise<ChatResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: opts.model });
  const { tools, toolConfig } = buildToolArgs(opts);

  const result = await model.generateContent({
    systemInstruction: opts.system ?? undefined,
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
    },
    tools,
    toolConfig,
  });

  const functionCalls = extractFunctionCalls(() => result.response.functionCalls());

  // functionCall 응답일 때 text() 호출 시 빈 문자열 또는 에러 가능
  let text = '';
  try {
    text = result.response.text();
  } catch {
    // functionCall 전용 응답 — text 없음
  }

  const usage = result.response.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;

  return {
    text,
    usage: makeUsage(opts.model, inputTokens, outputTokens),
    model: opts.model,
    functionCalls,
  };
}

/**
 * Gemini streaming chat — text delta 를 흘리고 종료 시점에 usage 포함 done 이벤트.
 */
export async function* stream(
  messages: AiMessage[],
  opts: ChatOptions,
): AsyncIterable<StreamEvent> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: opts.model });
  const { tools, toolConfig } = buildToolArgs(opts);

  const result = await model.generateContentStream({
    systemInstruction: opts.system ?? undefined,
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
    },
    tools,
    toolConfig,
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { type: 'delta', text };
    }
  }

  const final = await result.response;
  const usage = final.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;

  yield {
    type: 'done',
    usage: makeUsage(opts.model, inputTokens, outputTokens),
    model: opts.model,
  };
}

/**
 * Gemini streaming chat + function calling 감지.
 *
 * Agent executor 용 — 텍스트 delta 를 실시간 yield 하면서,
 * 스트림 종료 후 functionCall 이 있으면 function_calls 이벤트를 yield.
 * 최종 done 이벤트에 누적 텍스트 + usage 포함.
 */
export async function* streamChat(
  messages: AiMessage[],
  opts: ChatOptions,
): AsyncIterable<StreamChatEvent> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: opts.model });
  const { tools, toolConfig } = buildToolArgs(opts);

  const result = await model.generateContentStream({
    systemInstruction: opts.system ?? undefined,
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
    },
    tools,
    toolConfig,
  });

  let fullText = '';

  for await (const chunk of result.stream) {
    try {
      const text = chunk.text();
      if (text) {
        fullText += text;
        yield { type: 'delta', text };
      }
    } catch {
      // functionCall 전용 청크 — text() 호출 시 에러. 무시.
    }
  }

  const final = await result.response;

  // functionCall 감지
  const functionCalls = extractFunctionCalls(() => final.functionCalls());
  if (functionCalls?.length) {
    yield { type: 'function_calls', calls: functionCalls };
  }

  const usage = final.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;

  yield {
    type: 'done',
    usage: makeUsage(opts.model, inputTokens, outputTokens),
    model: opts.model,
    text: fullText,
  };
}
