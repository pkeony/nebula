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
    <aside className="hidden md:flex flex-col w-72 h-screen p-6 space-y-2 bg-[var(--color-surface-low)] rounded-r-[2rem]">
      {/* 브랜드 */}
      <div className="mb-8 px-4">
        <span className="font-[Manrope] text-lg font-bold text-[var(--color-primary)]">
          Nebula AI
        </span>
        <p className="text-xs text-[var(--color-text-secondary)] opacity-70">
          Agent Platform
        </p>
      </div>

      {/* 새 대화 버튼 */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-3 bg-[var(--color-surface-lowest)] text-[var(--color-primary)] rounded-full px-4 py-3 shadow-[0_4px_12px_rgba(45,51,53,0.04)] hover:shadow-[0_8px_24px_rgba(45,51,53,0.08)] transition-all duration-200 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-xl">add</span>
        <span className="text-sm font-medium">New Chat</span>
      </button>

      {/* 세션 목록 */}
      <nav className="flex-1 overflow-y-auto space-y-1 mt-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSwitch(session.id)}
            className={`
              group flex items-center gap-3 rounded-full px-4 py-3 cursor-pointer transition-all duration-200 active:translate-x-0.5
              ${session.id === activeSessionId
                ? 'bg-[var(--color-surface-lowest)] text-[var(--color-primary)] shadow-[0_2px_8px_rgba(45,51,53,0.04)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-lowest)]/80'
              }
            `}
          >
            <span className="material-symbols-outlined text-lg opacity-60">chat</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{session.title}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 opacity-60">
                {formatTime(session.createdAt)}
              </div>
            </div>

            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-all p-1"
                title="삭제"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* 하단 */}
      <div className="pt-4 mt-auto space-y-1">
        <button className="w-full py-3 px-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm shadow-[0_4px_16px_rgba(70,101,94,0.15)] transition-transform active:scale-[0.98]">
          Upgrade to Pro
        </button>
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)] px-4 py-3 hover:bg-[var(--color-surface-lowest)]/80 rounded-full transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-lg">settings</span>
          <span className="text-sm">Settings</span>
        </div>
      </div>
    </aside>
  );
}
