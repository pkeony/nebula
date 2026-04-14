import type { Edge } from '@xyflow/react';
import type { AgentEvent } from '@/types/agent-events';
import type { AgentNode } from '@/types/graph';
import { ROW_SPACING, PAIR_GAP, NODE_WIDTH } from '@/components/flow/nodes/node-styles';

/**
 * 세로 흐름 레이아웃.
 * - 메인 노드(user, thinking, response, done)는 중앙 열
 * - tool_call(왼쪽) → tool_result(오른쪽) 좌우 페어링
 */
export function buildGraph(
  events: AgentEvent[],
  userMessage: string,
): { nodes: AgentNode[]; edges: Edge[] } {
  const nodes: AgentNode[] = [];
  const edges: Edge[] = [];
  let responseNodeId: string | null = null;

  const centerX = 0;
  const leftX = -(NODE_WIDTH / 2 + PAIR_GAP / 2);
  const rightX = NODE_WIDTH / 2 + PAIR_GAP / 2;
  let row = 0;

  // Start 노드 (사용자 메시지) — 중앙
  const startId = 'start';
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: centerX - NODE_WIDTH / 2, y: row * ROW_SPACING },
    data: { message: userMessage },
  });

  let prevMainId = startId;

  for (const event of events) {
    switch (event.type) {
      case 'thinking': {
        row++;
        const id = `thinking-${row}`;
        nodes.push({
          id,
          type: 'thinking',
          position: { x: centerX - NODE_WIDTH / 2, y: row * ROW_SPACING },
          data: { content: event.content },
        });
        edges.push(makeEdge(prevMainId, id));
        prevMainId = id;
        break;
      }

      case 'tool_call': {
        row++;
        const callId = `tool-call-${event.id}`;
        nodes.push({
          id: callId,
          type: 'toolCall',
          position: { x: leftX - NODE_WIDTH / 2, y: row * ROW_SPACING },
          data: { toolCallId: event.id, tool: event.tool, args: event.args },
        });
        // 메인 흐름 → tool_call
        edges.push(makeEdge(prevMainId, callId));
        prevMainId = callId;
        break;
      }

      case 'tool_result': {
        const resultId = `tool-result-${event.id}`;
        const callId = `tool-call-${event.id}`;
        // tool_call과 같은 행에 오른쪽 배치
        const callNode = nodes.find((n) => n.id === callId);
        const resultY = callNode ? callNode.position.y : row * ROW_SPACING;

        nodes.push({
          id: resultId,
          type: 'toolResult',
          position: { x: rightX - NODE_WIDTH / 2, y: resultY },
          data: {
            toolCallId: event.id,
            tool: event.tool,
            result: event.result,
            isError: event.isError,
          },
        });
        // tool_call → tool_result (좌→우)
        edges.push(makeEdge(callId, resultId));
        // tool_result가 다음 메인 흐름의 소스
        prevMainId = resultId;
        break;
      }

      case 'delta': {
        if (!responseNodeId) {
          row++;
          responseNodeId = `response-${row}`;
          nodes.push({
            id: responseNodeId,
            type: 'response',
            position: { x: centerX - NODE_WIDTH / 2, y: row * ROW_SPACING },
            data: { text: event.text },
          });
          edges.push(makeEdge(prevMainId, responseNodeId));
          prevMainId = responseNodeId;
        } else {
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
        row++;
        const id = `done-${row}`;
        nodes.push({
          id,
          type: 'done',
          position: { x: centerX - NODE_WIDTH / 2, y: row * ROW_SPACING },
          data: {
            inputTokens: event.usage.inputTokens,
            outputTokens: event.usage.outputTokens,
            costUsd: event.usage.costUsd,
            model: event.model,
            iterations: event.iterations,
          },
        });
        edges.push(makeEdge(prevMainId, id));
        prevMainId = id;
        break;
      }

      case 'error': {
        row++;
        const id = `error-${row}`;
        nodes.push({
          id,
          type: 'error',
          position: { x: centerX - NODE_WIDTH / 2, y: row * ROW_SPACING },
          data: { message: event.message },
        });
        edges.push(makeEdge(prevMainId, id));
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
    type: 'default',
    animated: true,
    style: { stroke: 'var(--color-primary)', strokeWidth: 1.5, opacity: 0.3 },
  };
}
