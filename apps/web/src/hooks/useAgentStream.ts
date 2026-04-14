'use client';

import { useCallback, useReducer, useRef } from 'react';
import type { AgentEvent, ErrorCode } from '@/types/agent-events';
import { streamAgentRun } from '@/lib/sse-client';

/* ── 상태 타입 ─────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
        messages: [...state.messages, { role: 'user', content: action.message }],
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
          msgs.push({ role: 'assistant', content: event.text });
        }
        return { ...state, messages: msgs, events };
      }

      if (event.type === 'done') {
        return {
          ...state,
          status: 'done',
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
