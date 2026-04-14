'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ThinkingNodeData } from '@/types/graph';

const MAX_LINES = 3;

export function ThinkingNode({ data }: NodeProps & { data: ThinkingNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const lines = data.content.split('\n');
  const needsTruncate = lines.length > MAX_LINES;
  const display = expanded ? data.content : lines.slice(0, MAX_LINES).join('\n');

  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-primary)]" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[var(--color-primary-container)] text-[var(--color-primary)]">
          <span className="material-symbols-outlined">psychology</span>
        </div>
        <span className="flow-node-title">판단</span>
      </div>
      <div className="flow-node-body opacity-70 italic">
        {display}
        {needsTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-1 text-[10px] text-[var(--color-primary)] hover:underline"
          >
            {expanded ? '접기' : '더보기…'}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
