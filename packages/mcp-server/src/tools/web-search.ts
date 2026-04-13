import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const webSearchInputSchema = {
  query: z.string().describe('검색할 쿼리'),
  maxResults: z.number().optional().describe('최대 결과 수 (기본: 5)'),
};

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export function registerWebSearch(server: McpServer): void {
  server.registerTool('web_search', {
    description: '웹에서 정보를 검색합니다 (Tavily Search API).',
    inputSchema: webSearchInputSchema,
  }, async ({ query, maxResults }) => {
    const apiKey = process.env['TAVILY_API_KEY'];
    if (!apiKey) {
      return {
        content: [{ type: 'text' as const, text: '[에러] TAVILY_API_KEY 환경변수가 설정되지 않았습니다.' }],
        isError: true,
      };
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults ?? 5,
        include_answer: false,
      }),
    });

    if (!res.ok) {
      const errBody = (await res.text()).slice(0, 500);
      return {
        content: [{ type: 'text' as const, text: `[에러] Tavily API ${res.status}: ${errBody}` }],
        isError: true,
      };
    }

    const data = (await res.json()) as TavilyResponse;
    const formatted = data.results
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.content.slice(0, 200)}`)
      .join('\n\n');

    return {
      content: [{ type: 'text' as const, text: formatted || '검색 결과가 없습니다.' }],
    };
  });
}
