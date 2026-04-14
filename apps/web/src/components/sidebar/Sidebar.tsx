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
    <aside className="hidden md:flex flex-col w-72 h-full p-4 bg-[var(--color-surface-low)]">
      {/* 브랜드 */}
      <div className="px-4 pt-2 pb-6">
        <span className="font-[Manrope] text-lg font-bold tracking-tight text-[var(--color-primary)]">
          Nebula AI
        </span>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
          Digital Sanctuary
        </p>
      </div>

      {/* 새 대화 버튼 */}
      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim,#3a5952)] text-[var(--color-on-primary)] rounded-xl py-3 px-4 font-medium text-sm transition-all mb-6"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        New Thread
      </button>

      {/* 세션 목록 */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              onClick={() => onSwitch(session.id)}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-left transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-surface-lowest)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-lowest)]/60'
                }
              `}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                chat_bubble
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${isActive ? 'font-semibold' : ''}`}>
                  {session.title}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 opacity-50">
                  {formatTime(session.createdAt)}
                </div>
              </div>

              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-all p-1 rounded-lg hover:bg-[var(--color-surface-low)]"
                  title="삭제"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </button>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="mt-auto pt-4 space-y-1">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)] px-3 py-2.5 hover:bg-[var(--color-surface-lowest)]/60 rounded-xl transition-colors cursor-pointer text-sm">
          <span className="material-symbols-outlined text-lg">menu_book</span>
          Documentation
        </div>
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)] px-3 py-2.5 hover:bg-[var(--color-surface-lowest)]/60 rounded-xl transition-colors cursor-pointer text-sm">
          <span className="material-symbols-outlined text-lg">settings</span>
          Settings
        </div>
      </div>
    </aside>
  );
}
