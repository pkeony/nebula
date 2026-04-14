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

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 h-20 bg-[var(--color-surface)]">
        <h1 className="text-xl font-extrabold font-[Manrope] text-[var(--color-primary)] tracking-tight">
          Agent Chat
        </h1>
        <button
          onClick={onReset}
          className="text-xs px-3 py-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-high)] transition-colors"
        >
          New Chat
        </button>
      </header>

      {/* 메시지 목록 */}
      <MessageList messages={state.messages} />

      {/* 상태 표시 */}
      {state.status === 'streaming' && (
        <div className="px-6 py-2 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            에이전트 실행 중...
          </span>
        </div>
      )}

      {/* 에러 표시 */}
      {errorDisplay && (
        <div className="mx-6 mb-2 px-4 py-3 rounded-xl bg-[var(--color-error-container)]/10 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-error)] text-lg">warning</span>
          <span className="text-sm text-[var(--color-error)] flex-1">
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
      <ChatInput onSend={onSend} disabled={state.status === 'streaming'} />
    </div>
  );
}
