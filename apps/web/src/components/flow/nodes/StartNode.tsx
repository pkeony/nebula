import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StartNodeData } from '@/types/graph';

export function StartNode({ data }: NodeProps & { data: StartNodeData }) {
  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-text-secondary)]" />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[var(--color-surface-high)] text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined">person</span>
        </div>
        <span className="flow-node-title">User</span>
      </div>
      <div className="flow-node-body">{data.message}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
