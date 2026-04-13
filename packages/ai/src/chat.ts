import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseEnv } from '@nebula/shared/env';
import { makeUsage } from './pricing.js';
import type { AiMessage, ChatOptions, ChatResult, StreamEvent } from './types.js';

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

function toGeminiContents(messages: AiMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));
}

/**
 * 비-스트리밍 chat. eval judge 에서 사용.
 */
export async function chat(messages: AiMessage[], opts: ChatOptions): Promise<ChatResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: opts.model });

  const result = await model.generateContent({
    systemInstruction: opts.system ?? undefined,
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
    },
  });

  const text = result.response.text();
  const usage = result.response.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;

  return {
    text,
    usage: makeUsage(opts.model, inputTokens, outputTokens),
    model: opts.model,
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

  const result = await model.generateContentStream({
    systemInstruction: opts.system ?? undefined,
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
    },
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
