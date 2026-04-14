'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ToolResultNodeData } from '@/types/graph';

const MAX_LINES = 3;

export function ToolResultNode({ data }: NodeProps & { data: ToolResultNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const lines = data.result.split('\n');
  const needsTruncate = lines.length > MAX_LINES;
  const display = expanded ? data.result : lines.slice(0, MAX_LINES).join('\n');
  const toolName = data.tool.replace(/__/g, '.').replace(/_/g, ' ');

  const accentColor = data.isError ? 'var(--color-error)' : 'var(--color-primary)';
  const iconBg = data.isError ? 'bg-[rgba(250,116,111,0.15)]' : 'bg-[var(--color-primary-container)]';
  const iconColor = data.isError ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]';

  return (
    <div className="flow-node">
      <div className="flow-node-accent" style={{ background: accentColor }} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header">
        <div className={`flow-node-icon ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined">
            {data.isError ? 'error' : 'check_circle'}
          </span>
        </div>
        <span className="flow-node-title">Result</span>
        <span className="flow-node-meta">{toolName}</span>
      </div>
      <div className="flow-node-body">
        <pre className="text-[11px] whitespace-pre-wrap font-mono">{display}</pre>
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
