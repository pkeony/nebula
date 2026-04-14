import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DoneNodeData } from '@/types/graph';

export function DoneNode({ data }: NodeProps & { data: DoneNodeData }) {
  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-primary)]" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[var(--color-primary-container)] text-[var(--color-primary)]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <span className="flow-node-title">완료</span>
      </div>
      <div className="flow-node-body text-[11px] space-y-1.5">
        <div className="flex justify-between">
          <span className="opacity-50">모델</span>
          <span className="font-medium">{data.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">반복</span>
          <span className="font-medium">{data.iterations}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">토큰</span>
          <span className="font-medium">{data.inputTokens.toLocaleString()} 입력 / {data.outputTokens.toLocaleString()} 출력</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">비용</span>
          <span className="font-medium">${data.costUsd.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
