import type { UnifiedTool } from '@nebula/mcp-client';
import type { AiFunctionDeclaration } from '@nebula/ai';

/**
 * MCP UnifiedTool[] → AiFunctionDeclaration[] 변환.
 *
 * Gemini tool name 제약: [a-zA-Z_][a-zA-Z0-9_-]{0,63}
 * → dots 불가하므로 qualifiedName 대신 단순 tool.name 사용.
 *
 * 멀티 서버에서 이름 충돌 시 첫 번째 서버의 도구가 우선됨.
 * 향후 필요하면 underscore 치환 (nebula_read_file) 전략 적용.
 */
function hasProperties(
  schema: object,
): schema is { properties: Record<string, unknown>; required?: string[] } {
  return 'properties' in schema;
}

export function mcpToolsToFunctionDeclarations(
  tools: UnifiedTool[],
): AiFunctionDeclaration[] {
  return tools.map((ut) => {
    const schema = ut.tool.inputSchema;

    return {
      name: ut.tool.name,
      description: ut.tool.description,
      parameters:
        schema && typeof schema === 'object' && hasProperties(schema)
          ? {
              type: 'object' as const,
              properties: schema.properties,
              required: schema.required,
            }
          : undefined,
    };
  });
}

/**
 * 단순 tool name → qualifiedName 역매핑 생성.
 *
 * McpRegistry.callTool() 은 qualifiedName ("nebula.read_file") 또는
 * 단순 name ("read_file") 모두 허용하므로, 단순 name 으로 호출해도 동작한다.
 * 하지만 멀티 서버 환경에서 명시적 라우팅이 필요할 때를 위해 매핑 유지.
 */
export function buildToolNameMap(tools: UnifiedTool[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const ut of tools) {
    if (!map.has(ut.tool.name)) {
      map.set(ut.tool.name, ut.qualifiedName);
    }
  }
  return map;
}
