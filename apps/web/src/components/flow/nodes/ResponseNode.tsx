import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ResponseNodeData } from '@/types/graph';

export function ResponseNode({ data }: NodeProps & { data: ResponseNodeData }) {
  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-tertiary)]" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[var(--color-tertiary-container)] text-[var(--color-tertiary)]">
          <span className="material-symbols-outlined">chat_bubble</span>
        </div>
        <span className="flow-node-title">응답</span>
      </div>
      <div className="flow-node-body whitespace-pre-wrap">{data.text}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
