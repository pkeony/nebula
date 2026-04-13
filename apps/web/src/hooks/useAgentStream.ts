'use client';

import { useCallback, useReducer, useRef } from 'react';
import type { AgentEvent } from '@/types/agent-events';
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
}

const initialState: AgentStreamState = {
  status: 'idle',
  messages: [],
  events: [],
  error: null,
};

/* ── Reducer 액션 ──────────────────────────────────── */

type Action =
  | { type: 'SEND'; message: string }
  | { type: 'EVENT'; event: AgentEvent }
  | { type: 'STREAM_ERROR'; error: string }
  | { type: 'RESET' };

function reducer(state: AgentStreamState, action: Action): AgentStreamState {
  switch (action.type) {
    case 'SEND':
      return {
        ...state,
        status: 'streaming',
        messages: [...state.messages, { role: 'user', content: action.message }],
        events: [],
        error: null,
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
        return { ...state, status: 'done', events };
      }

      if (event.type === 'error') {
        return { ...state, status: 'error', events, error: event.message };
      }

      return { ...state, events };
    }

    case 'STREAM_ERROR':
      return { ...state, status: 'error', error: action.error };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/* ── Hook ──────────────────────────────────────────── */

export function useAgentStream() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (message: string) => {
    // 이전 스트림 중단
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: 'SEND', message });

    try {
      await streamAgentRun(
        message,
        (event) => dispatch({ type: 'EVENT', event }),
        { signal: controller.signal },
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      dispatch({ type: 'STREAM_ERROR', error: (err as Error).message });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  return { state, send, reset };
}
