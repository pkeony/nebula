'use client';

import type { AgentStreamState } from '@/hooks/useAgentStream';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  state: AgentStreamState;
  onSend: (message: string) => void;
  onReset: () => void;
}

export function ChatPanel({ state, onSend, onReset }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h1 className="text-sm font-semibold tracking-tight">Nebula Agent</h1>
        <button
          onClick={onReset}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* 메시지 목록 */}
      <MessageList messages={state.messages} />

      {/* 상태 표시 */}
      {state.status === 'streaming' && (
        <div className="px-4 py-1 text-xs text-[var(--color-text-secondary)]">
          에이전트 실행 중...
        </div>
      )}
      {state.status === 'error' && state.error && (
        <div className="px-4 py-1 text-xs text-[var(--color-error)]">
          {state.error}
        </div>
      )}

      {/* 입력 */}
      <ChatInput onSend={onSend} disabled={state.status === 'streaming'} />
    </div>
  );
}
