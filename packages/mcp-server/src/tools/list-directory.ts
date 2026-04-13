import { z } from 'zod';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const listDirectoryInputSchema = {
  path: z.string().describe('탐색할 디렉토리의 절대 경로 또는 상대 경로'),
};

export function registerListDirectory(server: McpServer): void {
  server.registerTool('list_directory', {
    description: '디렉토리 내 파일과 폴더 목록을 반환합니다',
    inputSchema: listDirectoryInputSchema,
  }, async ({ path }) => {
    const entries = await readdir(path);
    const details = await Promise.all(
      entries.map(async (name) => {
        const fullPath = join(path, name);
        const info = await stat(fullPath);
        return `${info.isDirectory() ? '[dir]' : '[file]'} ${name}`;
      }),
    );

    return {
      content: [{ type: 'text' as const, text: details.join('\n') }],
    };
  });
}
