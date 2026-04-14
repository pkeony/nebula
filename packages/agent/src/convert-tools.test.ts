import { describe, it, expect } from 'vitest';
import { mcpToolsToFunctionDeclarations, buildToolNameMap } from './convert-tools.js';
import type { UnifiedTool } from '@nebula/mcp-client';

function makeTool(overrides: Partial<UnifiedTool> = {}): UnifiedTool {
  return {
    serverName: 'nebula',
    qualifiedName: 'nebula.read_file',
    tool: {
      name: 'read_file',
      description: '파일을 읽는다',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '파일 경로' },
        },
        required: ['path'],
      },
    },
    ...overrides,
  };
}

describe('mcpToolsToFunctionDeclarations', () => {
  it('UnifiedTool을 AiFunctionDeclaration으로 변환한다', () => {
    const tools = [makeTool()];
    const result = mcpToolsToFunctionDeclarations(tools);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('nebula__read_file');
    expect(result[0].description).toContain('[nebula]');
    expect(result[0].parameters?.properties).toHaveProperty('path');
  });

  it('qualifiedName의 dot을 __로 치환한다', () => {
    const tools = [makeTool({ qualifiedName: 'github.search_repos' })];
    const result = mcpToolsToFunctionDeclarations(tools);

    expect(result[0].name).toBe('github__search_repos');
  });

  it('허용되지 않은 스키마 필드를 제거한다', () => {
    const tools = [makeTool({
      tool: {
        name: 'test_tool',
        description: '테스트',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '검색어',
              additionalProperties: false,
              $schema: 'http://json-schema.org/draft-07/schema#',
              default: '',
            },
          },
          required: ['query'],
          additionalProperties: false,
        },
      },
    })];

    const result = mcpToolsToFunctionDeclarations(tools);
    const params = result[0].parameters;

    // additionalProperties, $schema, default 가 제거되어야 함
    expect(params).toBeDefined();
    expect(params?.properties?.query).not.toHaveProperty('additionalProperties');
    expect(params?.properties?.query).not.toHaveProperty('$schema');
    expect(params?.properties?.query).not.toHaveProperty('default');
    // 허용된 필드는 유지
    expect(params?.properties?.query).toHaveProperty('type', 'string');
    expect(params?.properties?.query).toHaveProperty('description', '검색어');
  });

  it('inputSchema가 없으면 parameters가 undefined', () => {
    const tools = [makeTool({
      tool: {
        name: 'simple',
        description: '간단한 도구',
        inputSchema: { type: 'object' },
      },
    })];

    const result = mcpToolsToFunctionDeclarations(tools);
    expect(result[0].parameters).toBeUndefined();
  });

  it('빈 배열이면 빈 배열 반환', () => {
    expect(mcpToolsToFunctionDeclarations([])).toEqual([]);
  });
});

describe('buildToolNameMap', () => {
  it('gemini name → qualified name 매핑을 생성한다', () => {
    const tools = [
      makeTool({ qualifiedName: 'nebula.read_file' }),
      makeTool({ qualifiedName: 'github.search_repos' }),
    ];

    const map = buildToolNameMap(tools);

    expect(map.get('nebula__read_file')).toBe('nebula.read_file');
    expect(map.get('github__search_repos')).toBe('github.search_repos');
    expect(map.size).toBe(2);
  });

  it('빈 배열이면 빈 Map', () => {
    const map = buildToolNameMap([]);
    expect(map.size).toBe(0);
  });
});
