'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ToolResultNodeData } from '@/types/graph';
import { NODE_CONFIG } from './node-styles';

const MAX_LINES = 3;

export function ToolResultNode({ data }: NodeProps & { data: ToolResultNodeData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = NODE_CONFIG.toolResult;
  const borderColor = data.isError ? cfg.errorColor : cfg.color;
  const lines = data.result.split('\n');
  const needsTruncate = lines.length > MAX_LINES;
  const display = expanded ? data.result : lines.slice(0, MAX_LINES).join('\n');

  return (
    <div className="agent-node" style={{ borderLeftColor: borderColor }}>
      <Handle type="target" position={Position.Top} />
      <div className="agent-node-header">
        <span>{cfg.icon}</span>
        <span className="agent-node-label">{cfg.label}</span>
        <span className="ml-auto text-xs opacity-60">{data.tool}</span>
        {data.isError && <span className="ml-1 text-xs text-[var(--color-error)]">ERROR</span>}
      </div>
      <div className="agent-node-body">
        <pre className="text-xs whitespace-pre-wrap">{display}</pre>
        {needsTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-1 text-xs text-[var(--color-tool-result-ok)] hover:underline"
          >
            {expanded ? '접기' : '더보기...'}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
