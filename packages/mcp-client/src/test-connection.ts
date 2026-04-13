#!/usr/bin/env node

/**
 * MCP 서버↔클라이언트 통신 테스트.
 *
 * nebula-mcp-server를 stdio로 spawn 하고:
 * 1. listTools() → 도구 6개 확인
 * 2. read_file → CLAUDE.md 읽기
 * 3. run_command → echo hello
 * 4. list_directory → 프로젝트 루트
 */

import { McpRegistry } from './registry.js';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..');

async function main() {
  const registry = new McpRegistry();

  console.log('=== MCP 통신 테스트 시작 ===\n');

  // 1. 서버 등록
  console.log('1. 서버 등록 중...');
  const tools = await registry.register({
    name: 'nebula',
    command: 'node',
    args: [resolve(PROJECT_ROOT, 'packages/mcp-server/dist/cli.js')],
    cwd: PROJECT_ROOT,
  });

  console.log(`   등록 완료! 도구 ${tools.length}개 발견:`);
  for (const t of tools) {
    console.log(`   - ${t.qualifiedName}: ${t.tool.description}`);
  }

  // 2. read_file 테스트
  console.log('\n2. read_file 테스트 (CLAUDE.md)...');
  const readResult = await registry.callTool('read_file', {
    path: resolve(PROJECT_ROOT, 'CLAUDE.md'),
  });
  const preview = readResult.content[0]?.text.slice(0, 100) ?? '';
  console.log(`   첫 100자: ${preview}...`);

  // 3. run_command 테스트
  console.log('\n3. run_command 테스트 (echo hello)...');
  const cmdResult = await registry.callTool('run_command', {
    command: 'echo hello from MCP',
  });
  console.log(`   결과: ${cmdResult.content[0]?.text}`);

  // 4. list_directory 테스트
  console.log('\n4. list_directory 테스트 (프로젝트 루트)...');
  const dirResult = await registry.callTool('list_directory', {
    path: PROJECT_ROOT,
  });
  console.log(`   결과:\n${dirResult.content[0]?.text.split('\n').map((l) => `   ${l}`).join('\n')}`);

  // 정리
  await registry.dispose();
  console.log('\n=== 테스트 완료 ===');
}

main().catch((err) => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
