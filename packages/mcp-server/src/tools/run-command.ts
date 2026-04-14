import { z } from 'zod';
import { exec } from 'node:child_process';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * 실행 허용 명령어 화이트리스트.
 * 접두사 매칭 — "ls" 는 "ls -la" 도 허용.
 */
const ALLOWED_PREFIXES = [
  'ls', 'cat', 'head', 'tail', 'wc',
  'find', 'grep', 'rg',
  'node', 'npx', 'pnpm', 'npm',
  'git log', 'git status', 'git diff', 'git branch',
  'echo', 'pwd', 'which', 'env',
  'tree', 'du', 'df',
];

/** 명시적으로 차단하는 패턴 */
const BLOCKED_PATTERNS = [
  /\brm\s+-rf\b/,
  /\bsudo\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bcurl\b.*\|\s*sh/,
  /\bwget\b.*\|\s*sh/,
  />\s*\/etc\//,
  />\s*\/usr\//,
];

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim();

  // 차단 패턴 먼저 체크
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: `차단된 패턴: ${pattern.source}` };
    }
  }

  // 화이트리스트 접두사 체크
  const allowed = ALLOWED_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix),
  );

  if (!allowed) {
    return { allowed: false, reason: `허용되지 않은 명령어. 허용 목록: ${ALLOWED_PREFIXES.join(', ')}` };
  }

  return { allowed: true };
}

export const runCommandInputSchema = {
  command: z.string().describe('실행할 셸 명령어'),
  cwd: z.string().optional().describe('작업 디렉토리 (기본: 현재 디렉토리)'),
  timeout: z.number().optional().describe('타임아웃 (ms, 기본: 30000)'),
};

function execAsync(
  command: string,
  options: { cwd?: string; timeout: number },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(command, {
      cwd: options.cwd,
      timeout: options.timeout,
      maxBuffer: 1024 * 1024, // 1MB
    }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: error?.code ?? 0,
      });
    });
  });
}

export function registerRunCommand(server: McpServer): void {
  server.registerTool('run_command', {
    description: '셸 명령어를 실행하고 stdout/stderr를 반환합니다. 화이트리스트 기반 — 허용된 명령어만 실행 가능.',
    inputSchema: runCommandInputSchema,
  }, async ({ command, cwd, timeout }) => {
    const check = isCommandAllowed(command);
    if (!check.allowed) {
      return {
        content: [{ type: 'text' as const, text: `[BLOCKED] ${check.reason}` }],
        isError: true,
      };
    }

    const result = await execAsync(command, {
      cwd: cwd ?? undefined,
      timeout: timeout ?? 30_000,
    });

    const output = [
      `$ ${command}`,
      result.stdout ? `[stdout]\n${result.stdout}` : '',
      result.stderr ? `[stderr]\n${result.stderr}` : '',
      `[exit code: ${result.exitCode}]`,
    ].filter(Boolean).join('\n');

    return {
      content: [{ type: 'text' as const, text: output }],
    };
  });
}

/** 테스트용 export */
export { isCommandAllowed };
