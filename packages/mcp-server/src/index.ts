import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerReadFile } from './tools/read-file.js';
import { registerListDirectory } from './tools/list-directory.js';
import { registerGrepSearch } from './tools/grep-search.js';
import { registerWriteFile } from './tools/write-file.js';
import { registerRunCommand } from './tools/run-command.js';
import { registerWebSearch } from './tools/web-search.js';

interface ServerOptions {
  /** 파일 읽기/쓰기를 허용할 루트 디렉토리 (기본: process.cwd()) */
  allowedRoot?: string;
}

/**
 * Nebula 커스텀 MCP 서버 생성.
 *
 * 도구 등록만 하고 transport 연결은 호출자에게 위임한다.
 * - CLI: StdioServerTransport
 * - 테스트: InMemoryTransport
 * - HTTP: StreamableHTTPServerTransport (추후)
 */
export function createServer(options?: ServerOptions): McpServer {
  const allowedRoot = options?.allowedRoot ?? process.cwd();

  const server = new McpServer({
    name: 'nebula-mcp-server',
    version: '0.0.1',
  });

  // 읽기 도구
  registerReadFile(server, allowedRoot);
  registerListDirectory(server);
  registerGrepSearch(server);

  // 쓰기/실행 도구
  registerWriteFile(server, allowedRoot);
  registerRunCommand(server);
  registerWebSearch(server);

  return server;
}
