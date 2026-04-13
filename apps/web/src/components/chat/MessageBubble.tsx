import type { ChatMessage } from '@/hooks/useAgentStream';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--color-thinking)] text-white'
            : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
