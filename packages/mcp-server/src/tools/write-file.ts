import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validatePath } from '../path-guard.js';

export const writeFileInputSchema = {
  path: z.string().describe('쓸 파일의 절대 경로 또는 상대 경로'),
  content: z.string().describe('파일에 쓸 내용'),
};

export function registerWriteFile(server: McpServer, allowedRoot: string): void {
  server.registerTool('write_file', {
    description: '파일에 내용을 씁니다. 허용된 디렉토리 내에서만 쓰기 가능.',
    inputSchema: writeFileInputSchema,
  }, async ({ path, content }) => {
    const check = validatePath(path, allowedRoot);
    if (!check.safe) {
      return {
        content: [{ type: 'text' as const, text: `[BLOCKED] ${check.reason}` }],
        isError: true,
      };
    }

    await mkdir(dirname(check.resolved), { recursive: true });
    await writeFile(check.resolved, content, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: `파일 작성 완료: ${check.resolved}` }],
    };
  });
}
