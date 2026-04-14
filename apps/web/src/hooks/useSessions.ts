'use client';

import { useCallback, useState } from 'react';
import type { AgentStreamState } from './useAgentStream';

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  /** 이 세션의 스냅샷 상태 (전환 시 저장/복원) */
  snapshot: AgentStreamState | null;
}

export interface SessionManager {
  sessions: Session[];
  activeSessionId: string;
  createSession: () => string;
  switchSession: (id: string, currentState: AgentStreamState) => AgentStreamState | null;
  deleteSession: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
}

let nextId = 1;

function generateId(): string {
  return `session-${Date.now()}-${nextId++}`;
}

function titleFromMessage(message: string): string {
  const trimmed = message.trim().slice(0, 40);
  return trimmed.length < message.trim().length ? `${trimmed}...` : trimmed;
}

export function useSessions(): SessionManager {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const id = generateId();
    return [{ id, title: '새 대화', createdAt: Date.now(), snapshot: null }];
  });
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0].id);

  const createSession = useCallback(() => {
    const id = generateId();
    const session: Session = { id, title: '새 대화', createdAt: Date.now(), snapshot: null };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(id);
    return id;
  }, []);

  const switchSession = useCallback((id: string, currentState: AgentStreamState): AgentStreamState | null => {
    // 현재 세션 스냅샷 저장
    setSessions((prev) => prev.map((s) => {
      if (s.id === activeSessionId) {
        const title = currentState.messages.length > 0
          ? titleFromMessage(currentState.messages[0].content)
          : '새 대화';
        return { ...s, snapshot: currentState, title };
      }
      return s;
    }));

    setActiveSessionId(id);

    // 대상 세션의 스냅샷 반환
    const target = sessions.find((s) => s.id === id);
    return target?.snapshot ?? null;
  }, [activeSessionId, sessions]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const newId = generateId();
        return [{ id: newId, title: '새 대화', createdAt: Date.now(), snapshot: null }];
      }
      return filtered;
    });

    if (activeSessionId === id) {
      setSessions((prev) => {
        setActiveSessionId(prev[0].id);
        return prev;
      });
    }
  }, [activeSessionId]);

  const updateTitle = useCallback((id: string, title: string) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
  }, []);

  return { sessions, activeSessionId, createSession, switchSession, deleteSession, updateTitle };
}
