import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const readFileInputSchema = {
  path: z.string().describe('읽을 파일의 절대 경로 또는 상대 경로'),
};

export function registerReadFile(server: McpServer): void {
  server.registerTool('read_file', {
    description: '파일 내용을 읽어서 반환합니다',
    inputSchema: readFileInputSchema,
  }, async ({ path }) => {
    const content = await readFile(path, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: content }],
    };
  });
}
