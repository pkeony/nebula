'use client';

import type { AgentStreamState } from '@/hooks/useAgentStream';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  state: AgentStreamState;
  onSend: (message: string) => void;
  onRetry: () => void;
  onReset: () => void;
}

function getErrorDisplay(state: AgentStreamState): { message: string; showRetry: boolean } | null {
  if (state.status !== 'error' || !state.error) return null;

  const messages: Record<string, string> = {
    rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    server_error: '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.',
    validation: '잘못된 요청입니다. 메시지를 확인해 주세요.',
    timeout: '에이전트 실행 시간이 초과되었습니다.',
    aborted: '실행이 취소되었습니다.',
  };

  const message = (state.errorCode && messages[state.errorCode]) || state.error;
  return { message, showRetry: state.retryable };
}

export function ChatPanel({ state, onSend, onRetry, onReset }: ChatPanelProps) {
  const errorDisplay = getErrorDisplay(state);
  const isStreaming = state.status === 'streaming';

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 — editorial minimal */}
      <header className="flex items-center justify-between px-8 h-16">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Active Session
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-low)] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New
        </button>
      </header>

      {/* 메시지 목록 */}
      <MessageList messages={state.messages} />

      {/* 스트리밍 상태 — 하단 subtle indicator */}
      {isStreaming && (
        <div className="px-8 py-3 flex items-center gap-2.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-[11px] text-[var(--color-text-secondary)] tracking-wide">
            Composing response…
          </span>
        </div>
      )}

      {/* 에러 표시 */}
      {errorDisplay && (
        <div className="mx-6 mb-2 px-5 py-3.5 rounded-2xl bg-[var(--color-error-container)]/8 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-error)] text-base">info</span>
          <span className="text-sm text-[var(--color-error)] flex-1 leading-relaxed">
            {errorDisplay.message}
          </span>
          {errorDisplay.showRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-4 py-1.5 rounded-full bg-[var(--color-surface-lowest)] text-[var(--color-text)] shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* 입력 */}
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
