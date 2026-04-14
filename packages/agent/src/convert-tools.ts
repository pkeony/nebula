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

/** Gemini functionDeclarations 가 허용하는 JSON Schema 필드 */
const ALLOWED_SCHEMA_KEYS = new Set([
  'type', 'properties', 'required', 'items', 'description',
  'enum', 'format', 'nullable', 'any_of',
]);

/**
 * Gemini API가 허용하지 않는 JSON Schema 필드를 재귀적으로 제거.
 * 외부 MCP 서버(filesystem, github 등)의 스키마에는 additionalProperties,
 * $schema, default, anyOf 같은 필드가 포함되어 400 에러를 유발한다.
 */
function sanitizeSchema(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeSchema);
  if (typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (!ALLOWED_SCHEMA_KEYS.has(key) && key !== 'properties') {
      // properties 는 key 자체가 아니라 자식 key 이름이므로 보존
      continue;
    }
    if (key === 'properties' && typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [propKey, propValue] of Object.entries(value as Record<string, unknown>)) {
        sanitized[propKey] = sanitizeSchema(propValue);
      }
      result[key] = sanitized;
    } else {
      result[key] = sanitizeSchema(value);
    }
  }
  return result;
}

function hasProperties(
  schema: object,
): schema is { properties: Record<string, unknown>; required?: string[] } {
  return 'properties' in schema;
}

/**
 * Gemini-safe 도구 이름 생성.
 * qualifiedName "nebula.read_file" → "nebula__read_file"
 * Gemini 제약: [a-zA-Z_][a-zA-Z0-9_-]{0,63}, dot 불가.
 */
function toGeminiName(qualifiedName: string): string {
  return qualifiedName.replace('.', '__');
}

export function mcpToolsToFunctionDeclarations(
  tools: UnifiedTool[],
): AiFunctionDeclaration[] {
  return tools.map((ut) => {
    const schema = ut.tool.inputSchema;

    return {
      name: toGeminiName(ut.qualifiedName),
      description: `[${ut.serverName}] ${ut.tool.description}`,
      parameters:
        schema && typeof schema === 'object' && hasProperties(schema)
          ? sanitizeSchema({
              type: 'object' as const,
              properties: schema.properties,
              required: schema.required,
            }) as { type: 'object'; properties: Record<string, unknown>; required?: string[] }
          : undefined,
    };
  });
}

/**
 * Gemini-safe name → qualifiedName 역매핑 생성.
 * "nebula__read_file" → "nebula.read_file"
 */
export function buildToolNameMap(tools: UnifiedTool[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const ut of tools) {
    map.set(toGeminiName(ut.qualifiedName), ut.qualifiedName);
  }
  return map;
}
