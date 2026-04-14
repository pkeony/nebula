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

export const ROW_SPACING = 140;
export const PAIR_GAP = 40;
export const NODE_WIDTH = 280;
