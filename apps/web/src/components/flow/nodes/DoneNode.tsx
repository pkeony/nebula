import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DoneNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

export function DoneNode({ data }: NodeProps & { data: DoneNodeData }) {
  const cfg = NODE_CONFIG.done;
  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
      </div>
      <div className="agent-node-body text-xs space-y-1">
        <div className="flex justify-between">
          <span className="opacity-60">Model</span>
          <span>{data.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">Iterations</span>
          <span>{data.iterations}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">Tokens</span>
          <span>{data.inputTokens.toLocaleString()} in / {data.outputTokens.toLocaleString()} out</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">Cost</span>
          <span>${data.costUsd.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
