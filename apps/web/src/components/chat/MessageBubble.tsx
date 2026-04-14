import type { ChatMessage } from '@/hooks/useAgentStream';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-[var(--color-surface-low)] text-[var(--color-text)] rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant — Ethereal editorial card
  return (
    <div className="flex justify-start">
      <div className="w-full bg-[var(--color-surface-lowest)] rounded-2xl px-8 py-8 shadow-[0_8px_30px_rgba(45,51,53,0.04)]">
        {/* 응답 본문 — editorial typography */}
        <div className="text-[var(--color-text)] text-[15px] leading-[1.8] whitespace-pre-wrap break-words font-light">
          {message.content}
        </div>
      </div>
    </div>
  );
}
