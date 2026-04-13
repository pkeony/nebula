import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StartNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

export function StartNode({ data }: NodeProps & { data: StartNodeData }) {
  const cfg = NODE_CONFIG.start;
  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
      </div>
      <div className="agent-node-body">{data.message}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
