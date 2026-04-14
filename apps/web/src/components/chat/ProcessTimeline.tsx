'use client';

import { useEffect, useRef } from 'react';
import type { AgentEvent } from '@/types/agent-events';

interface ProcessTimelineProps {
  events: AgentEvent[];
  isStreaming: boolean;
}

interface TimelineStep {
  type: 'thinking' | 'tool_group';
  label: string;
  detail: string;
  icon: string;
  status: 'done' | 'active' | 'error';
  count: number;
  doneCount: number;
  errorCount: number;
}

function buildSteps(events: AgentEvent[]): TimelineStep[] {
  const steps: TimelineStep[] = [];

  for (const event of events) {
    if (event.type === 'thinking') {
      steps.push({
        type: 'thinking',
        label: 'Analyzing Intent',
        detail: event.content.slice(0, 90) + (event.content.length > 90 ? '…' : ''),
        icon: 'psychology',
        status: 'done',
        count: 1,
        doneCount: 1,
        errorCount: 0,
      });
    } else if (event.type === 'tool_call') {
      const toolName = event.tool;
      const hasResult = events.some(
        (e) => e.type === 'tool_result' && e.id === event.id,
      );
      const hasError = events.some(
        (e) => e.type === 'tool_result' && e.id === event.id && e.isError,
      );

      // 직전 스텝이 같은 도구면 그룹에 합치기
      const prev = steps[steps.length - 1];
      if (prev && prev.type === 'tool_group' && prev.label === formatToolName(toolName)) {
        prev.count += 1;
        if (hasResult) prev.doneCount += 1;
        if (hasError) prev.errorCount += 1;
        // 그룹 상태 갱신
        if (prev.errorCount > 0) {
          prev.status = 'error';
        } else if (prev.doneCount < prev.count) {
          prev.status = 'active';
        } else {
          prev.status = 'done';
        }
        // detail 갱신 — 마지막 호출의 args 사용
        const argDetail = Object.keys(event.args).length > 0
          ? Object.entries(event.args)
              .slice(0, 2)
              .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
              .join(', ')
          : '';
        if (argDetail) prev.detail = argDetail;
      } else {
        steps.push({
          type: 'tool_group',
          label: formatToolName(toolName),
          detail: Object.keys(event.args).length > 0
            ? Object.entries(event.args)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
                .join(', ')
            : 'Processing…',
          icon: getToolIcon(toolName),
          status: hasError ? 'error' : hasResult ? 'done' : 'active',
          count: 1,
          doneCount: hasResult ? 1 : 0,
          errorCount: hasError ? 1 : 0,
        });
      }
    }
  }

  return steps;
}

function formatToolName(tool: string): string {
  return tool
    .replace(/__/g, '.')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getToolIcon(tool: string): string {
  const lower = tool.toLowerCase();
  if (lower.includes('search') || lower.includes('web')) return 'travel_explore';
  if (lower.includes('read') || lower.includes('file')) return 'description';
  if (lower.includes('code') || lower.includes('exec')) return 'terminal';
  if (lower.includes('database') || lower.includes('sql')) return 'database';
  if (lower.includes('list') || lower.includes('dir')) return 'folder_open';
  if (lower.includes('write')) return 'edit_note';
  if (lower.includes('weather')) return 'cloud';
  return 'neurology';
}

function StatusBadge({ step }: { step: TimelineStep }) {
  const { status, count, doneCount } = step;

  if (status === 'done') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
          {count > 1 ? `${count}/${count} Completed` : 'Completed'}
        </span>
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse [animation-delay:75ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse [animation-delay:150ms]" />
        </div>
        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
          {count > 1 ? `${doneCount}/${count} Processing` : 'Processing'}
        </span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
        <span className="text-[10px] font-bold text-[var(--color-error)] uppercase tracking-wider">
          {step.errorCount} Error{step.errorCount > 1 ? 's' : ''}
        </span>
      </div>
    );
  }
  return null;
}

export function ProcessTimeline({ events, isStreaming }: ProcessTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const steps = buildSteps(events);
  const hasContent = steps.length > 0;

  // 새 스텝 추가 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length, events.length]);

  if (!hasContent && !isStreaming) return null;

  const toolCount = events.filter((e) => e.type === 'tool_call').length;
  const doneCount = events.filter((e) => e.type === 'tool_result').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 헤더 — 고정 */}
      <div className="flex justify-between items-end px-8 pt-8 pb-4 flex-shrink-0">
        <h2 className="font-[Manrope] text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
          Process Flow
        </h2>
        {isStreaming && toolCount > 0 && (
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-primary)] px-2.5 py-1 bg-[var(--color-primary-container)] rounded-full">
            {doneCount}/{toolCount} done
          </span>
        )}
        {!isStreaming && hasContent && (
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-primary)] px-2.5 py-1 bg-[var(--color-primary-container)] rounded-full">
            {steps.length} steps
          </span>
        )}
      </div>

      {/* 타임라인 — 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="relative flex flex-col gap-6">
          {/* 점선 세로 라인 */}
          <div
            className="absolute left-[23px] top-6 bottom-6 w-[2px] opacity-40"
            style={{
              backgroundImage: 'radial-gradient(var(--color-outline) 1px, transparent 1px)',
              backgroundSize: '1px 12px',
            }}
          />

          {steps.map((step, i) => {
            const isActive = step.status === 'active';
            const isError = step.status === 'error';
            const isGroup = step.count > 1;

            return (
              <div key={i} className="flex items-start gap-5 relative group">
                {/* 아이콘 노드 */}
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center z-10 flex-shrink-0 transition-all relative
                    ${isActive
                      ? 'bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 text-[var(--color-on-primary)]'
                      : isError
                        ? 'glass-panel shadow-md text-[var(--color-error)]'
                        : 'glass-panel shadow-md text-[var(--color-primary)]'
                    }
                  `}
                  style={!isActive ? { border: '1px solid rgba(255,255,255,0.5)' } : undefined}
                >
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                  {/* 그룹 카운트 뱃지 */}
                  {isGroup && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {step.count}
                    </span>
                  )}
                </div>

                {/* 카드 */}
                <div
                  className={`
                    flex-1 p-5 rounded-2xl transition-all
                    ${isActive
                      ? 'bg-[var(--color-primary-container)] shadow-md'
                      : 'glass-panel shadow-sm'
                    }
                    group-hover:-translate-y-0.5 group-hover:shadow-md
                  `}
                  style={!isActive ? { border: '1px solid rgba(255,255,255,0.4)' } : undefined}
                >
                  <h4
                    className={`font-[Manrope] font-bold text-sm ${
                      isActive
                        ? 'text-[var(--color-on-primary-container)]'
                        : 'text-[var(--color-text)]'
                    }`}
                  >
                    {step.label}
                    {isGroup && (
                      <span className="ml-2 text-[10px] font-normal opacity-60">
                        ×{step.count}
                      </span>
                    )}
                  </h4>
                  <p
                    className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                      isActive
                        ? 'text-[var(--color-on-primary-container)]/80'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {step.detail}
                  </p>
                  <div className="mt-3">
                    <StatusBadge step={step} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* 스트리밍 중 empty state */}
          {isStreaming && steps.length === 0 && (
            <div className="flex items-start gap-5 relative">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center z-10 flex-shrink-0">
                <span className="material-symbols-outlined text-xl text-[var(--color-on-primary)] animate-pulse">
                  psychology
                </span>
              </div>
              <div className="flex-1 bg-[var(--color-primary-container)] p-5 rounded-2xl shadow-md">
                <h4 className="font-[Manrope] font-bold text-sm text-[var(--color-on-primary-container)]">
                  Initializing
                </h4>
                <p className="text-xs text-[var(--color-on-primary-container)]/80 mt-1">
                  Preparing agent context…
                </p>
                <div className="mt-3">
                  <StatusBadge step={{ type: 'thinking', label: '', detail: '', icon: '', status: 'active', count: 1, doneCount: 0, errorCount: 0 }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 — Execution Summary */}
        {!isStreaming && hasContent && (
          <div className="pt-8">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" style={{ border: '1px solid rgba(237,218,200,0.3)' }}>
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: 'var(--color-tertiary-container)' }}
              />
              <h5 className="font-[Manrope] font-bold text-sm text-[var(--color-text)] mb-2">
                Execution Summary
              </h5>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {toolCount} tool call{toolCount !== 1 ? 's' : ''} across {steps.filter((s) => s.type === 'tool_group').length} step{steps.filter((s) => s.type === 'tool_group').length !== 1 ? 's' : ''}, {doneCount} completed.
              </p>
            </div>
          </div>
        )}

        {/* 자동 스크롤 앵커 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
