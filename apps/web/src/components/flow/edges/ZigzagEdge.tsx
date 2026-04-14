'use client';

import { type EdgeProps, getBezierPath } from '@xyflow/react';

/**
 * 직각 꺾임 커스텀 엣지.
 * source 아래 → 중간 높이에서 수평 → target 위로 내려감.
 * 레퍼런스: Lumina Flow SVG path 패턴.
 */
export function ZigzagEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  // 중간 Y = source와 target의 중간
  const midY = sourceY + (targetY - sourceY) / 2;

  // ㄱ자 직각 경로: 아래 → 수평 → 아래
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke="#46655e"
      strokeWidth={2.5}
      markerEnd={markerEnd as string}
      style={style}
    />
  );
}
