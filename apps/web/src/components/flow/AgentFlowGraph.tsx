'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import type { AgentEvent } from '@/types/agent-events';
import type { ChatMessage } from '@/hooks/useAgentStream';
import { buildGraph } from '@/lib/graph-layout';
import { StartNode } from './nodes/StartNode';
import { ThinkingNode } from './nodes/ThinkingNode';
import { ToolCallNode } from './nodes/ToolCallNode';
import { ToolResultNode } from './nodes/ToolResultNode';
import { ResponseNode } from './nodes/ResponseNode';
import { DoneNode } from './nodes/DoneNode';
import { ErrorNode } from './nodes/ErrorNode';

const nodeTypes: NodeTypes = {
  start: StartNode,
  thinking: ThinkingNode,
  toolCall: ToolCallNode,
  toolResult: ToolResultNode,
  response: ResponseNode,
  done: DoneNode,
  error: ErrorNode,
};

interface AgentFlowGraphProps {
  events: AgentEvent[];
  messages: ChatMessage[];
  isDone: boolean;
}

export function AgentFlowGraph({ events, messages, isDone }: AgentFlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const { fitView } = useReactFlow();

  const userMessage = useMemo(() => {
    const last = messages.findLast((m) => m.role === 'user');
    return last?.content ?? '';
  }, [messages]);

  // 이벤트가 변경될 때마다 그래프 재빌드
  useEffect(() => {
    if (!userMessage && events.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: newNodes, edges: newEdges } = buildGraph(events, userMessage);

    // done 이후 엣지 애니메이션 정지
    if (isDone) {
      for (const edge of newEdges) {
        edge.animated = false;
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [events, userMessage, isDone, setNodes, setEdges]);

  // 새 노드 추가 시 뷰 자동 이동
  const handleNodesChange = useCallback(
    (...args: Parameters<typeof onNodesChange>) => {
      onNodesChange(...args);
      requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.2 });
      });
    },
    [onNodesChange, fitView],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      minZoom={0.3}
      maxZoom={1.5}
    />
  );
}
