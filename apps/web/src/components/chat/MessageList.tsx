'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/hooks/useAgentStream';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-surface-low)] flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">
              auto_awesome
            </span>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-[Manrope] font-bold text-[var(--color-text)] tracking-tight">
              What can I help you with?
            </h3>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              Ask a question to begin a new reflection.
            </p>
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
