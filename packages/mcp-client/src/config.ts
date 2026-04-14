import { readFile } from 'node:fs/promises';
import type { ServerConfig } from './registry.js';

/**
 * mcp-servers.json 설정 파일 스키마.
 *
 * 외부 MCP 서버를 추가하려면 servers 배열에 항목을 추가하면 된다.
 * enabled: false 로 설정하면 해당 서버는 건너뛴다.
 */
interface ServerEntry {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  enabled?: boolean;
}

interface McpServersConfig {
  servers: ServerEntry[];
}

/**
 * JSON 설정 파일에서 MCP 서버 목록을 로드한다.
 * enabled !== false 인 서버만 반환.
 */
export async function loadServerConfigs(configPath: string): Promise<ServerConfig[]> {
  const raw = await readFile(configPath, 'utf-8');
  const config: McpServersConfig = JSON.parse(raw);

  if (!config.servers || !Array.isArray(config.servers)) {
    throw new Error(`[loadServerConfigs] "servers" 배열이 없습니다: ${configPath}`);
  }

  return config.servers
    .filter((s) => s.enabled !== false)
    .map(({ name, command, args, env, cwd }) => ({ name, command, args, env, cwd }));
}
