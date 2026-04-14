import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validatePath } from '../path-guard.js';

export const readFileInputSchema = {
  path: z.string().describe('읽을 파일의 절대 경로 또는 상대 경로'),
};

export function registerReadFile(server: McpServer, allowedRoot: string): void {
  server.registerTool('read_file', {
    description: '파일 내용을 읽어서 반환합니다. 허용된 디렉토리 내 파일만 접근 가능.',
    inputSchema: readFileInputSchema,
  }, async ({ path }) => {
    const check = validatePath(path, allowedRoot);
    if (!check.safe) {
      return {
        content: [{ type: 'text' as const, text: `[BLOCKED] ${check.reason}` }],
        isError: true,
      };
    }

    const content = await readFile(check.resolved, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: content }],
    };
  });
}
