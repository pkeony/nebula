'use client';

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 변경 시 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[var(--color-surface-lowest)] via-[var(--color-surface-lowest)] to-transparent">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="glass-panel rounded-2xl p-2 shadow-[0_20px_50px_rgba(45,51,53,0.1)] flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="에이전트에게 질문하세요..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[var(--color-text)] px-4 py-2.5 placeholder:text-[var(--color-outline)] font-medium text-sm resize-none disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: '160px' }}
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">arrow_upward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
