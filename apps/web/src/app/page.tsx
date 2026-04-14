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
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* 사이드바 */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSwitch={handleSwitch}
        onDelete={handleDelete}
      />

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 탑바 */}
        <header className="flex justify-between items-center px-8 h-16 bg-[var(--color-surface)] shadow-[0_20px_40px_rgba(45,51,53,0.02)] sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-extrabold font-[Manrope] text-[var(--color-primary)] tracking-tight">
              Nebula AI
            </h2>
            <nav className="hidden lg:flex items-center gap-4">
              <span className="text-sm font-bold text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] px-1 py-1">
                Chat
              </span>
              <span className="text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-lowest)]/50 px-3 py-1 rounded-md transition-colors cursor-pointer">
                Flow
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors">
              <span className="material-symbols-outlined text-[var(--color-text-secondary)]">search</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--color-on-primary)] text-sm">person</span>
            </div>
          </div>
        </header>

        {/* 콘텐츠 — 채팅 + Flow 분할 */}
        <div className="flex-1 flex">
          {/* 채팅 */}
          <div className="w-[480px] min-w-[400px] flex flex-col bg-[var(--color-surface)]">
            <ChatPanel state={state} onSend={send} onRetry={retry} onReset={handleNewChat} />
          </div>

          {/* React Flow 시각화 */}
          <div className="flex-1 bg-[var(--color-surface-low)]">
            <FlowPanel events={state.events} messages={state.messages} status={state.status} />
          </div>
        </div>
      </main>
    </div>
  );
}
