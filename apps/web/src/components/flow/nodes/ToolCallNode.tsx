import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ToolCallNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

export function ToolCallNode({ data }: NodeProps & { data: ToolCallNodeData }) {
  const cfg = NODE_CONFIG.toolCall;
  const argsPreview = JSON.stringify(data.args, null, 2).slice(0, 120);

  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
        <span className="ml-auto text-xs opacity-60">{data.tool}</span>
      </div>
      <div className="agent-node-body">
        <pre className="text-xs opacity-80 whitespace-pre-wrap">{argsPreview}</pre>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
