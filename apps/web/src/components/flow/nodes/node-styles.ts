/** 노드 타입별 색상 + 아이콘 (Lumina Design System) */

export const NODE_CONFIG = {
  start: {
    color: 'var(--color-text-secondary)',
    label: 'User',
    icon: '💬',
  },
  thinking: {
    color: 'var(--color-primary)',
    label: 'Thinking',
    icon: '🧠',
  },
  toolCall: {
    color: 'var(--color-secondary)',
    label: 'Tool Call',
    icon: '🔧',
  },
  toolResult: {
    color: 'var(--color-primary)',
    errorColor: 'var(--color-error)',
    label: 'Tool Result',
    icon: '📋',
  },
  response: {
    color: 'var(--color-tertiary)',
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

export const VERTICAL_SPACING = 180;
export const HORIZONTAL_SPACING = 60;
export const NODE_WIDTH = 320;
export const MAX_PER_ROW = 4;
