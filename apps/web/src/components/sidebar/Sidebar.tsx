'use client';

import type { Session } from '@/hooks/useSessions';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onNewChat: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function Sidebar({ sessions, activeSessionId, onNewChat, onSwitch, onDelete }: SidebarProps) {
  return (
    <div className="flex flex-col h-full w-[220px] bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--color-border)]">
        <span className="text-xs font-semibold tracking-tight text-[var(--color-text-secondary)] uppercase">
          대화 목록
        </span>
        <button
          onClick={onNewChat}
          className="text-xs px-2 py-1 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          + 새 대화
        </button>
      </div>

      {/* 세션 목록 */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSwitch(session.id)}
            className={`
              group flex items-center gap-2 px-3 py-2 mx-1 rounded-md cursor-pointer transition-colors
              ${session.id === activeSessionId
                ? 'bg-[var(--color-bg)] text-[var(--color-text)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
              }
            `}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate">{session.title}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                {formatTime(session.createdAt)}
              </div>
            </div>

            {/* 삭제 버튼 — hover 시 표시 */}
            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-all"
                title="삭제"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
