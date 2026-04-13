import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ResponseNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

export function ResponseNode({ data }: NodeProps & { data: ResponseNodeData }) {
  const cfg = NODE_CONFIG.response;
  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
      </div>
      <div className="agent-node-body whitespace-pre-wrap">{data.text}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
