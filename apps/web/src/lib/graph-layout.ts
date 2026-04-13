import type { Edge } from '@xyflow/react';
import type { AgentEvent } from '@/types/agent-events';
import type { AgentNode } from '@/types/graph';
import { VERTICAL_SPACING } from '@/components/flow/nodes/node-styles';

/**
 * AgentEvent 배열을 React Flow 노드/엣지로 변환.
 * 수직 단일 열 레이아웃.
 */
export function buildGraph(
  events: AgentEvent[],
  userMessage: string,
): { nodes: AgentNode[]; edges: Edge[] } {
  const nodes: AgentNode[] = [];
  const edges: Edge[] = [];
  let responseNodeId: string | null = null;

  // Start 노드 (사용자 메시지)
  const startId = 'start';
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { message: userMessage },
  });

  let prevId = startId;
  let nodeIndex = 1;

  for (const event of events) {
    const y = nodeIndex * VERTICAL_SPACING;

    switch (event.type) {
      case 'thinking': {
        const id = `thinking-${nodeIndex}`;
        nodes.push({
          id,
          type: 'thinking',
          position: { x: 0, y },
          data: { content: event.content },
        });
        edges.push(makeEdge(prevId, id));
        prevId = id;
        nodeIndex++;
        break;
      }

      case 'tool_call': {
        const id = `tool-call-${event.id}`;
        nodes.push({
          id,
          type: 'toolCall',
          position: { x: 0, y },
          data: { toolCallId: event.id, tool: event.tool, args: event.args },
        });
        edges.push(makeEdge(prevId, id));
        prevId = id;
        nodeIndex++;
        break;
      }

      case 'tool_result': {
        const id = `tool-result-${event.id}`;
        nodes.push({
          id,
          type: 'toolResult',
          position: { x: 0, y },
          data: {
            toolCallId: event.id,
            tool: event.tool,
            result: event.result,
            isError: event.isError,
          },
        });
        // tool_call 노드에서 연결
        const callNodeId = `tool-call-${event.id}`;
        edges.push(makeEdge(callNodeId, id));
        prevId = id;
        nodeIndex++;
        break;
      }

      case 'delta': {
        // delta 는 하나의 Response 노드에 누적
        if (!responseNodeId) {
          responseNodeId = `response-${nodeIndex}`;
          nodes.push({
            id: responseNodeId,
            type: 'response',
            position: { x: 0, y },
            data: { text: event.text },
          });
          edges.push(makeEdge(prevId, responseNodeId));
          prevId = responseNodeId;
          nodeIndex++;
        } else {
          // 기존 Response 노드의 텍스트에 누적
          const responseNode = nodes.find((n) => n.id === responseNodeId);
          if (responseNode && responseNode.type === 'response') {
            responseNode.data = {
              ...responseNode.data,
              text: responseNode.data.text + event.text,
            };
          }
        }
        break;
      }

      case 'done': {
        const id = `done-${nodeIndex}`;
        nodes.push({
          id,
          type: 'done',
          position: { x: 0, y },
          data: {
            inputTokens: event.usage.inputTokens,
            outputTokens: event.usage.outputTokens,
            costUsd: event.usage.costUsd,
            model: event.model,
            iterations: event.iterations,
          },
        });
        edges.push(makeEdge(prevId, id));
        prevId = id;
        nodeIndex++;
        break;
      }

      case 'error': {
        const id = `error-${nodeIndex}`;
        nodes.push({
          id,
          type: 'error',
          position: { x: 0, y },
          data: { message: event.message },
        });
        edges.push(makeEdge(prevId, id));
        nodeIndex++;
        break;
      }
    }
  }

  return { nodes, edges };
}

function makeEdge(source: string, target: string): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: true,
  };
}
