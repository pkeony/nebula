'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ThinkingNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

const MAX_LINES = 3;

export function ThinkingNode({ data }: NodeProps & { data: ThinkingNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = NODE_CONFIG.thinking;
  const lines = data.content.split('\n');
  const needsTruncate = lines.length > MAX_LINES;
  const display = expanded ? data.content : lines.slice(0, MAX_LINES).join('\n');

  return (
    <div className="agent-node" style={{ borderLeftColor: cfg.color }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
      </div>
      <div className="agent-node-body">
        {display}
        {needsTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-1 text-xs text-[var(--color-thinking)] hover:underline"
          >
            {expanded ? '접기' : '더보기...'}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
