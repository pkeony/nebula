import type { ChatMessage } from '@/hooks/useAgentStream';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden ${
          isUser
            ? 'bg-[var(--color-surface-low)] text-[var(--color-text)] rounded-tr-none'
            : 'bg-[var(--color-surface-lowest)] text-[var(--color-text)] shadow-[0_4px_16px_rgba(45,51,53,0.04)]'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
