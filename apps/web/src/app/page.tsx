'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { FlowPanel } from '@/components/flow/FlowPanel';
import { useAgentStream } from '@/hooks/useAgentStream';

export default function HomePage() {
  const { state, send, reset } = useAgentStream();

  return (
    <div className="flex h-screen">
      {/* 왼쪽: 채팅 패널 */}
      <div className="w-[440px] min-w-[360px] border-r border-[var(--color-border)] flex flex-col">
        <ChatPanel state={state} onSend={send} onReset={reset} />
      </div>

      {/* 오른쪽: React Flow 시각화 */}
      <div className="flex-1">
        <FlowPanel events={state.events} messages={state.messages} status={state.status} />
      </div>
    </div>
  );
}
