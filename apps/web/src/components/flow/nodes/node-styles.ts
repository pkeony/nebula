/** 노드 타입별 색상 + 아이콘 상수 */

export const NODE_CONFIG = {
  start: {
    color: 'var(--color-text-secondary)',
    label: 'User',
    icon: '💬',
  },
  thinking: {
    color: 'var(--color-thinking)',
    label: 'Thinking',
    icon: '🧠',
  },
  toolCall: {
    color: 'var(--color-tool-call)',
    label: 'Tool Call',
    icon: '🔧',
  },
  toolResult: {
    color: 'var(--color-tool-result-ok)',
    errorColor: 'var(--color-tool-result-err)',
    label: 'Tool Result',
    icon: '📋',
  },
  response: {
    color: 'var(--color-response)',
    label: 'Response',
    icon: '💬',
  },
  done: {
    color: 'var(--color-done)',
    label: 'Done',
    icon: '✅',
  },
  error: {
    color: 'var(--color-error)',
    label: 'Error',
    icon: '❌',
  },
} as const;

export const VERTICAL_SPACING = 160;
export const NODE_WIDTH = 320;
