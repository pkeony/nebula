'use client';

import { useCallback } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ProcessTimeline } from '@/components/chat/ProcessTimeline';
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

  // Process Flow 표시 조건
  const isStreaming = state.status === 'streaming';
  const hasProcess = state.events.some((e) => e.type === 'tool_call' || e.type === 'thinking');
  const showTimeline = hasProcess || isStreaming;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* 사이드바 */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSwitch={handleSwitch}
        onDelete={handleDelete}
      />

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
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

        {/* 콘텐츠 — 채팅(메인) + Process Flow(오른쪽) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* 채팅 — 메인 캔버스 (독립 스크롤) */}
          <section className="flex-1 flex flex-col bg-[var(--color-surface-lowest)] min-w-0 h-full overflow-hidden">
            <ChatPanel state={state} onSend={send} onRetry={retry} onReset={handleNewChat} />
          </section>

          {/* Process Flow — 오른쪽 패널 (독립 스크롤, 이벤트 있을 때 슬라이드 인) */}
          <aside
            className={`
              hidden lg:flex flex-col flex-shrink-0 bg-[var(--color-surface-low)] overflow-y-auto overflow-x-hidden
              transition-all duration-500 ease-out
              ${showTimeline ? 'w-96 opacity-100' : 'w-0 opacity-0'}
            `}
          >
            {showTimeline && (
              <ProcessTimeline events={state.events} isStreaming={isStreaming} />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
