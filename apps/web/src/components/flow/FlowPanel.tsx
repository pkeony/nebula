'use client';

import { ReactFlowProvider } from '@xyflow/react';
import type { AgentEvent } from '@/types/agent-events';
import type { AgentStreamState, ChatMessage } from '@/hooks/useAgentStream';
import { AgentFlowGraph } from './AgentFlowGraph';

interface FlowPanelProps {
  events: AgentEvent[];
  messages: ChatMessage[];
  status: AgentStreamState['status'];
}

export function FlowPanel({ events, messages, status }: FlowPanelProps) {
  return (
    <div className="h-full relative">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
          에이전트 실행 흐름이 여기에 표시됩니다
        </div>
      ) : (
        <ReactFlowProvider>
          <AgentFlowGraph
            events={events}
            messages={messages}
            isDone={status === 'done' || status === 'error'}
          />
        </ReactFlowProvider>
      )}
    </div>
  );
}
