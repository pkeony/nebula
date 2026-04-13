import { z } from 'zod';
import { exec } from 'node:child_process';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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
    description: '셸 명령어를 실행하고 stdout/stderr를 반환합니다. 타임아웃 기본 30초.',
    inputSchema: runCommandInputSchema,
  }, async ({ command, cwd, timeout }) => {
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
