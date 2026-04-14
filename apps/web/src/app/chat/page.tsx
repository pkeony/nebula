'use client';

import { useCallback, useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ProcessTimeline } from '@/components/chat/ProcessTimeline';
import { FlowPanel } from '@/components/flow/FlowPanel';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useSessions } from '@/hooks/useSessions';
import Link from 'next/link';

export default function ChatPage() {
  const { state, send, retry, reset, restore } = useAgentStream();
  const { sessions, activeSessionId, createSession, switchSession, deleteSession } = useSessions();
  const [showFlowModal, setShowFlowModal] = useState(false);

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

  const isStreaming = state.status === 'streaming';
  const hasProcess = state.events.some((e) => e.type === 'tool_call' || e.type === 'thinking');
  const showRightPanel = hasProcess || isStreaming;

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
            <Link href="/" className="text-lg font-extrabold font-[Manrope] text-[var(--color-primary)] tracking-tight hover:opacity-80 transition-opacity">
              Nebula AI
            </Link>
          </div>
          <div className="flex items-center gap-3" />
        </header>

        {/* 콘텐츠 — 채팅 + 오른쪽 패널 */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* 채팅 */}
          <section className="flex-1 flex flex-col bg-[var(--color-surface-lowest)] min-w-0 overflow-hidden">
            <ChatPanel state={state} onSend={send} onRetry={retry} onReset={handleNewChat} />
          </section>

          {/* 오른쪽 패널 — Process Flow */}
          <aside
            className={`
              hidden lg:flex flex-col flex-shrink-0 bg-[var(--color-surface-low)] overflow-hidden
              transition-all duration-500 ease-out
              ${showRightPanel ? 'w-96 opacity-100' : 'w-0 opacity-0'}
            `}
          >
            {showRightPanel && (
              <ProcessTimeline
                events={state.events}
                isStreaming={isStreaming}
                onShowFlow={() => setShowFlowModal(true)}
              />
            )}
          </aside>
        </div>
      </main>

      {/* Flow Detail 모달 */}
      {showFlowModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-8"
          onClick={() => setShowFlowModal(false)}
        >
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-sm" />

          {/* 모달 본체 */}
          <div
            className="relative w-full max-w-6xl h-[80vh] bg-[var(--color-surface-lowest)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-8 h-14 flex-shrink-0">
              <h3 className="font-[Manrope] font-bold text-sm text-[var(--color-text)]">
                실행 흐름
              </h3>
              <button
                onClick={() => setShowFlowModal(false)}
                className="p-2 rounded-xl hover:bg-[var(--color-surface-low)] transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-text-secondary)]">close</span>
              </button>
            </div>

            {/* Flow 시각화 */}
            <div className="flex-1">
              <FlowPanel events={state.events} messages={state.messages} status={state.status} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
