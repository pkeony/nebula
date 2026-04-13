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

/** 에러 코드별 한국어 메시지 */
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

      {/* 에러 표시 */}
      {errorDisplay && (
        <div className="px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-[var(--color-error)] flex-1">
            {errorDisplay.message}
          </span>
          {errorDisplay.showRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors whitespace-nowrap"
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
