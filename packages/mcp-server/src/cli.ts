#!/usr/bin/env node

/**
 * Nebula MCP Server — stdio 모드 진입점.
 *
 * 사용: node dist/cli.js
 * MCP 클라이언트가 이 프로세스를 spawn 하고 stdin/stdout 으로 JSON-RPC 통신.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './index.js';

const server = createServer();
const transport = new StdioServerTransport();

await server.connect(transport);
