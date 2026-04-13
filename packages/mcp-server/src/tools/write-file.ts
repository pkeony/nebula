import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const writeFileInputSchema = {
  path: z.string().describe('쓸 파일의 절대 경로 또는 상대 경로'),
  content: z.string().describe('파일에 쓸 내용'),
};

export function registerWriteFile(server: McpServer): void {
  server.registerTool('write_file', {
    description: '파일에 내용을 씁니다. 상위 디렉토리가 없으면 자동 생성합니다.',
    inputSchema: writeFileInputSchema,
  }, async ({ path, content }) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: `파일 작성 완료: ${path}` }],
    };
  });
}
