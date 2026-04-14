'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ToolCallNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

const PREVIEW_LENGTH = 120;

export function ToolCallNode({ data }: NodeProps & { data: ToolCallNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = NODE_CONFIG.toolCall;
  const fullArgs = JSON.stringify(data.args, null, 2);
  const needsTruncate = fullArgs.length > PREVIEW_LENGTH;
  const display = expanded ? fullArgs : fullArgs.slice(0, PREVIEW_LENGTH) + (needsTruncate ? '...' : '');

  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
        <span className="ml-auto text-xs opacity-60">{data.tool}</span>
      </div>
      <div className="agent-node-body">
        <pre className="text-xs opacity-80 whitespace-pre-wrap">{display}</pre>
        {needsTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-1 text-xs text-[var(--color-tool-call)] hover:underline"
          >
            {expanded ? '접기' : '전체 보기...'}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
