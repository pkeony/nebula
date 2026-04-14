import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import type { ChatMessage } from '@/hooks/useAgentStream';
import { formatToolDisplay } from '@/utils/tool-labels';

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

  const hasSummary = message.toolSummary && message.toolSummary.length > 0;

  // Assistant — Ethereal editorial card + Markdown
  return (
    <div className="flex justify-start">
      <div className="w-full bg-[var(--color-surface-lowest)] rounded-2xl px-8 py-8 shadow-[0_8px_30px_rgba(45,51,53,0.04)]">
        {/* 도구 사용 요약 */}
        {hasSummary && (
          <div className="mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">neurology</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                사용한 도구
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.toolSummary!.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-primary-container)',
                    color: 'var(--color-on-primary-container)',
                  }}
                >
                  {formatToolDisplay(t.name)}
                  {t.count > 1 && (
                    <span className="opacity-60">×{t.count}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="prose-nebula">
          <Markdown rehypePlugins={[rehypeSanitize]}>{message.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
