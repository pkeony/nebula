'use client';

import { useCallback, useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ProcessTimeline } from '@/components/chat/ProcessTimeline';
import { FlowPanel } from '@/components/flow/FlowPanel';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useSessions } from '@/hooks/useSessions';

type ActiveTab = 'chat' | 'flow';

export default function HomePage() {
  const { state, send, retry, reset, restore } = useAgentStream();
  const { sessions, activeSessionId, createSession, switchSession, deleteSession } = useSessions();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

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

  // Process Flow 표시 조건 (Chat 탭에서만)
  const isStreaming = state.status === 'streaming';
  const hasProcess = state.events.some((e) => e.type === 'tool_call' || e.type === 'thinking');
  const showTimeline = activeTab === 'chat' && (hasProcess || isStreaming);

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
        <header className="flex justify-between items-center px-8 h-16 bg-[var(--color-surface)] shadow-[0_20px_40px_rgba(45,51,53,0.02)] flex-shrink-0 z-50">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-extrabold font-[Manrope] text-[var(--color-primary)] tracking-tight">
              Nebula AI
            </h2>
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'font-bold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-low)]'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'flow'
                    ? 'font-bold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-low)]'
                }`}
              >
                Flow
              </button>
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

        {/* 콘텐츠 */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Chat 탭 */}
          {activeTab === 'chat' && (
            <>
              <section className="flex-1 flex flex-col bg-[var(--color-surface-lowest)] min-w-0 overflow-hidden">
                <ChatPanel state={state} onSend={send} onRetry={retry} onReset={handleNewChat} />
              </section>

              {/* Process Flow — 오른쪽 패널 */}
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
            </>
          )}

          {/* Flow 탭 */}
          {activeTab === 'flow' && (
            <div className="flex-1 bg-[var(--color-surface-low)]">
              <FlowPanel events={state.events} messages={state.messages} status={state.status} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
