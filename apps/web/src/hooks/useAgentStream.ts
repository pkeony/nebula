'use client';

import { useCallback, useReducer, useRef } from 'react';
import type { AgentEvent, ErrorCode } from '@/types/agent-events';
import { streamAgentRun } from '@/lib/sse-client';

/* ── 상태 타입 ─────────────────────────────────────── */

let msgIdCounter = 0;

export interface ToolUsageSummary {
  name: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** assistant 메시지에 도구 사용 요약 */
  toolSummary?: ToolUsageSummary[];
}

export interface AgentStreamState {
  status: 'idle' | 'streaming' | 'done' | 'error';
  messages: ChatMessage[];
  events: AgentEvent[];
  error: string | null;
  errorCode: ErrorCode | null;
  retryable: boolean;
  conversationId: string | null;
}

const initialState: AgentStreamState = {
  status: 'idle',
  messages: [],
  events: [],
  error: null,
  errorCode: null,
  retryable: false,
  conversationId: null,
};

/* ── Reducer 액션 ──────────────────────────────────── */

type Action =
  | { type: 'SEND'; message: string }
  | { type: 'EVENT'; event: AgentEvent }
  | { type: 'STREAM_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'RESTORE'; state: AgentStreamState };

function reducer(state: AgentStreamState, action: Action): AgentStreamState {
  switch (action.type) {
    case 'SEND':
      return {
        ...state,
        status: 'streaming',
        messages: [...state.messages, { id: `msg-${++msgIdCounter}`, role: 'user', content: action.message }],
        events: [],
        error: null,
        errorCode: null,
        retryable: false,
      };

    case 'EVENT': {
      const event = action.event;
      const events = [...state.events, event];

      // delta 텍스트를 assistant 메시지에 누적
      if (event.type === 'delta') {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          msgs[msgs.length - 1] = { ...last, content: last.content + event.text };
        } else {
          msgs.push({ id: `msg-${++msgIdCounter}`, role: 'assistant', content: event.text });
        }
        return { ...state, messages: msgs, events };
      }

      if (event.type === 'done') {
        // 도구 사용 요약 생성
        const toolCounts = new Map<string, number>();
        for (const e of events) {
          if (e.type === 'tool_call') {
            const name = e.tool;
            toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
          }
        }
        const toolSummary: ToolUsageSummary[] = [];
        for (const [name, count] of toolCounts) {
          toolSummary.push({ name, count });
        }

        // assistant 메시지에 요약 추가
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && toolSummary.length > 0) {
          msgs[msgs.length - 1] = { ...last, toolSummary };
        }

        return {
          ...state,
          status: 'done',
          messages: msgs,
          events,
          conversationId: event.conversationId ?? state.conversationId,
        };
      }

      if (event.type === 'error') {
        return {
          ...state,
          status: 'error',
          events,
          error: event.message,
          errorCode: event.code,
          retryable: event.retryable,
        };
      }

      return { ...state, events };
    }

    case 'STREAM_ERROR':
      return { ...state, status: 'error', error: action.error, errorCode: 'unknown', retryable: false };

    case 'RESET':
      return initialState;

    case 'RESTORE':
      return action.state;

    default:
      return state;
  }
}

/* ── Hook ──────────────────────────────────────────── */

export function useAgentStream() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>('');

  const send = useCallback(async (message: string) => {
    // 이전 스트림 중단
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastMessageRef.current = message;

    dispatch({ type: 'SEND', message });

    try {
      await streamAgentRun(
        message,
        (event) => dispatch({ type: 'EVENT', event }),
        { signal: controller.signal, conversationId: state.conversationId ?? undefined },
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      dispatch({ type: 'STREAM_ERROR', error: (err as Error).message });
    }
  }, [state.conversationId]);

  const retry = useCallback(() => {
    if (lastMessageRef.current) {
      send(lastMessageRef.current);
    }
  }, [send]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  const restore = useCallback((snapshot: AgentStreamState) => {
    abortRef.current?.abort();
    dispatch({ type: 'RESTORE', state: snapshot });
  }, []);

  return { state, send, retry, reset, restore };
}
