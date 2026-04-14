'use client';

import { useCallback } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { FlowPanel } from '@/components/flow/FlowPanel';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useSessions } from '@/hooks/useSessions';

export default function HomePage() {
  const { state, send, retry, reset, restore } = useAgentStream();
  const { sessions, activeSessionId, createSession, switchSession, deleteSession } = useSessions();

  const handleNewChat = useCallback(() => {
    // 현재 세션 스냅샷 저장 + 새 세션 생성
    switchSession(createSession(), state);
    reset();
  }, [createSession, switchSession, state, reset]);

  const handleSwitch = useCallback((id: string) => {
    if (id === activeSessionId) return;
    const snapshot = switchSession(id, state);
    if (snapshot) {
      restore(snapshot);
    } else {
      reset();
    }
  }, [activeSessionId, switchSession, state, restore, reset]);

  const handleDelete = useCallback((id: string) => {
    deleteSession(id);
    if (id === activeSessionId) {
      reset();
    }
  }, [deleteSession, activeSessionId, reset]);

  return (
    <div className="flex h-screen">
      {/* 사이드바: 대화 목록 */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSwitch={handleSwitch}
        onDelete={handleDelete}
      />

      {/* 가운데: 채팅 패널 */}
      <div className="w-[440px] min-w-[360px] border-r border-[var(--color-border)] flex flex-col">
        <ChatPanel state={state} onSend={send} onRetry={retry} onReset={handleNewChat} />
      </div>

      {/* 오른쪽: React Flow 시각화 */}
      <div className="flex-1">
        <FlowPanel events={state.events} messages={state.messages} status={state.status} />
      </div>
    </div>
  );
}
