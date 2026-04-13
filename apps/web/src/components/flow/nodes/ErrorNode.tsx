import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ErrorNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

export function ErrorNode({ data }: NodeProps & { data: ErrorNodeData }) {
  const cfg = NODE_CONFIG.error;
  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
      </div>
      <div className="agent-node-body text-[var(--color-error)]">{data.message}</div>
    </div>
  );
}
