import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP 서버 연결 설정.
 *
 * stdio 기반: command + args 로 서버 프로세스를 spawn.
 * 예: { name: 'nebula', command: 'node', args: ['dist/cli.js'] }
 */
export interface ServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

/** 통합 도구 — 어떤 서버에서 왔는지 추적 */
export interface UnifiedTool {
  serverName: string;
  tool: Tool;
  /** Agent에게 전달할 qualified name (serverName.toolName) */
  qualifiedName: string;
}

interface ConnectedServer {
  config: ServerConfig;
  client: Client;
  transport: StdioClientTransport;
  tools: Tool[];
}

/**
 * MCP 멀티 서버 레지스트리.
 *
 * 여러 MCP 서버를 동시에 연결하고, 모든 도구를 하나의 통합 목록으로 관리한다.
 * Agent는 McpRegistry 하나만 알면 어떤 서버의 도구든 호출할 수 있다.
 *
 * 핵심 메서드:
 * - register(config) → 서버 연결 + 도구 디스커버리
 * - unregister(name) → 연결 해제
 * - listTools() → 모든 서버의 도구 통합 목록
 * - callTool(qualifiedName, args) → 서버 라우팅 + 도구 실행
 */
export class McpRegistry {
  private servers = new Map<string, ConnectedServer>();

  /** 서버 프로세스 spawn → 연결 → 도구 디스커버리 */
  async register(config: ServerConfig): Promise<UnifiedTool[]> {
    if (this.servers.has(config.name)) {
      throw new Error(`[McpRegistry] 서버 "${config.name}" 이미 등록됨`);
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
    });

    const client = new Client({
      name: 'nebula-mcp-client',
      version: '0.0.1',
    });

    await client.connect(transport);

    // 도구 디스커버리
    const { tools } = await client.listTools();

    this.servers.set(config.name, { config, client, transport, tools });

    return tools.map((tool) => ({
      serverName: config.name,
      tool,
      qualifiedName: `${config.name}.${tool.name}`,
    }));
  }

  /** 서버 연결 해제 + 프로세스 종료 */
  async unregister(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) return;

    await server.client.close();
    this.servers.delete(name);
  }

  /** 모든 서버의 도구를 통합 목록으로 반환 */
  listTools(): UnifiedTool[] {
    const result: UnifiedTool[] = [];
    for (const [name, server] of this.servers) {
      for (const tool of server.tools) {
        result.push({
          serverName: name,
          tool,
          qualifiedName: `${name}.${tool.name}`,
        });
      }
    }
    return result;
  }

  /**
   * 도구 호출 — qualifiedName (예: "nebula.read_file") 또는 단순 toolName 으로 호출.
   *
   * qualifiedName 형식이면 해당 서버로 직접 라우팅.
   * 단순 toolName 이면 도구를 가진 첫 번째 서버에서 실행.
   */
  async callTool(
    nameOrQualified: string,
    args: Record<string, unknown>,
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const { serverName, toolName } = this.resolveToolName(nameOrQualified);

    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`[McpRegistry] 서버 "${serverName}" 을 찾을 수 없습니다`);
    }

    const result = await server.client.callTool({ name: toolName, arguments: args });

    return {
      content: (result.content as Array<{ type: string; text: string }>) ?? [],
      isError: result.isError as boolean | undefined,
    };
  }

  /** qualifiedName 파싱: "server.tool" → { serverName, toolName } */
  private resolveToolName(nameOrQualified: string): { serverName: string; toolName: string } {
    const dotIndex = nameOrQualified.indexOf('.');
    if (dotIndex !== -1) {
      return {
        serverName: nameOrQualified.slice(0, dotIndex),
        toolName: nameOrQualified.slice(dotIndex + 1),
      };
    }

    // 단순 toolName — 도구를 가진 첫 번째 서버 찾기
    for (const [name, server] of this.servers) {
      if (server.tools.some((t) => t.name === nameOrQualified)) {
        return { serverName: name, toolName: nameOrQualified };
      }
    }

    throw new Error(`[McpRegistry] 도구 "${nameOrQualified}" 을 찾을 수 없습니다`);
  }

  /** 모든 서버 연결 해제 */
  async dispose(): Promise<void> {
    const names = [...this.servers.keys()];
    await Promise.all(names.map((name) => this.unregister(name)));
  }

  /** 등록된 서버 이름 목록 */
  get serverNames(): string[] {
    return [...this.servers.keys()];
  }
}
