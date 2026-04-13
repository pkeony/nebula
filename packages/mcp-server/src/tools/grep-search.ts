import { z } from 'zod';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const grepSearchInputSchema = {
  pattern: z.string().describe('검색할 텍스트 또는 정규식 패턴'),
  path: z.string().describe('검색 시작 디렉토리'),
  glob: z.string().optional().describe('파일 필터 (예: "*.ts", "*.json")'),
};

/** 간단한 재귀 텍스트 검색 — 외부 도구 의존 없이 순수 Node.js */
async function searchFiles(
  dir: string,
  regex: RegExp,
  glob: string | undefined,
  results: string[],
  maxResults: number,
): Promise<void> {
  if (results.length >= maxResults) return;

  const entries = await readdir(dir);
  for (const entry of entries) {
    if (results.length >= maxResults) return;

    const fullPath = join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      await searchFiles(fullPath, regex, glob, results, maxResults);
    } else {
      if (glob && !matchGlob(entry, glob)) continue;
      if (!isTextFile(entry)) continue;

      const content = await readFile(fullPath, 'utf-8').catch(() => null);
      if (!content) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${fullPath}:${i + 1}: ${lines[i].trim()}`);
          if (results.length >= maxResults) return;
        }
      }
    }
  }
}

function matchGlob(filename: string, glob: string): boolean {
  const ext = glob.replace('*', '');
  return filename.endsWith(ext);
}

function isTextFile(filename: string): boolean {
  const textExts = new Set(['.ts', '.js', '.json', '.md', '.yaml', '.yml', '.toml', '.txt', '.html', '.css', '.tsx', '.jsx']);
  return textExts.has(extname(filename));
}

export function registerGrepSearch(server: McpServer): void {
  server.registerTool('grep_search', {
    description: '파일 내용에서 패턴을 검색합니다. node_modules, .git, dist 는 자동 제외.',
    inputSchema: grepSearchInputSchema,
  }, async ({ pattern, path, glob }) => {
    const regex = new RegExp(pattern, 'i');
    const results: string[] = [];
    await searchFiles(path, regex, glob, results, 50);

    if (results.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `패턴 "${pattern}"에 대한 검색 결과가 없습니다.` }],
      };
    }

    return {
      content: [{ type: 'text' as const, text: results.join('\n') }],
    };
  });
}
