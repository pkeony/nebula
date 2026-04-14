import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ErrorNodeData } from '@/types/graph';

export function ErrorNode({ data }: NodeProps & { data: ErrorNodeData }) {
  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-error)]" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[rgba(250,116,111,0.15)] text-[var(--color-error)]">
          <span className="material-symbols-outlined">error</span>
        </div>
        <span className="flow-node-title">Error</span>
      </div>
      <div className="flow-node-body text-[var(--color-error)]">{data.message}</div>
    </div>
  );
}
