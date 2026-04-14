'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ToolCallNodeData } from '@/types/graph';

const PREVIEW_LENGTH = 100;

export function ToolCallNode({ data }: NodeProps & { data: ToolCallNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const fullArgs = JSON.stringify(data.args, null, 2);
  const needsTruncate = fullArgs.length > PREVIEW_LENGTH;
  const display = expanded ? fullArgs : fullArgs.slice(0, PREVIEW_LENGTH) + (needsTruncate ? '…' : '');

  const toolName = data.tool.replace(/__/g, '.').replace(/_/g, ' ');

  return (
    <div className="flow-node">
      <div className="flow-node-accent bg-[var(--color-secondary)]" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className="flow-node-icon bg-[var(--color-secondary-container)] text-[var(--color-secondary)]">
          <span className="material-symbols-outlined">build</span>
        </div>
        <span className="flow-node-title">Tool Call</span>
        <span className="flow-node-meta">{toolName}</span>
      </div>
      <div className="flow-node-body">
        <pre className="text-[11px] opacity-70 whitespace-pre-wrap font-mono">{display}</pre>
        {needsTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-1 text-[10px] text-[var(--color-secondary)] hover:underline"
          >
            {expanded ? '접기' : '전체 보기…'}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
