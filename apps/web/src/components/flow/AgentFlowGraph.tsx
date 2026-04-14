'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ConnectionMode,
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
import { NODE_WIDTH } from './nodes/node-styles';
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

/** 최신 노드를 적당한 줌으로 추적하는 줌 레벨 */
const FOLLOW_ZOOM = 0.85;

interface AgentFlowGraphProps {
  events: AgentEvent[];
  messages: ChatMessage[];
  isDone: boolean;
}

export function AgentFlowGraph({ events, messages, isDone }: AgentFlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const { setCenter, fitView } = useReactFlow();
  const prevNodeCount = useRef(0);

  const userMessage = useMemo(() => {
    const last = messages.findLast((m) => m.role === 'user');
    return last?.content ?? '';
  }, [messages]);

  // 이벤트가 변경될 때마다 그래프 재빌드
  useEffect(() => {
    if (!userMessage && events.length === 0) {
      setNodes([]);
      setEdges([]);
      prevNodeCount.current = 0;
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

    // 새 노드 추가 시 → 최신 노드로 카메라 이동 (fitView 대신 setCenter)
    if (newNodes.length > prevNodeCount.current && newNodes.length > 0) {
      const lastNode = newNodes[newNodes.length - 1];
      requestAnimationFrame(() => {
        setCenter(
          lastNode.position.x + NODE_WIDTH / 2,
          lastNode.position.y,
          { zoom: FOLLOW_ZOOM, duration: 300 },
        );
      });
    }
    prevNodeCount.current = newNodes.length;
  }, [events, userMessage, isDone, setNodes, setEdges, setCenter]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      connectionMode={ConnectionMode.Loose}
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
