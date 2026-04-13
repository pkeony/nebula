# MCP 아키텍처 설계

> Nebula의 MCP 서버 + 클라이언트 구조 상세.

## 개요

Nebula는 MCP 프로토콜 양쪽(서버 + 클라이언트)을 직접 구현한다.
- **서버** (`@nebula/mcp-server`): 개발 워크플로우 도구를 MCP 프로토콜로 제공
- **클라이언트** (`@nebula/mcp-client`): 멀티 서버 연결 + 도구 통합 + 라우팅

## 통신 흐름

```
Agent
  │
  ▼
McpRegistry (클라이언트)
  │
  ├── stdio ──> nebula-mcp-server (커스텀)
  │               ├── read_file
  │               ├── list_directory
  │               ├── grep_search
  │               ├── write_file
  │               ├── run_command
  │               └── web_search
  │
  └── stdio ──> (추후 추가 서버)
```

## MCP 서버 — 도구 목록

| 도구 | 설명 | 입력 |
|------|------|------|
| `read_file` | 파일 내용 읽기 | `{ path }` |
| `list_directory` | 디렉토리 탐색 | `{ path }` |
| `grep_search` | 파일 내용 검색 | `{ pattern, path, glob? }` |
| `write_file` | 파일 쓰기 (디렉토리 자동 생성) | `{ path, content }` |
| `run_command` | 셸 명령 실행 (30s 타임아웃) | `{ command, cwd?, timeout? }` |
| `web_search` | Tavily API 웹 검색 | `{ query, maxResults? }` |

## MCP 클라이언트 — McpRegistry

### 핵심 개념: 멀티 서버 통합

```typescript
const registry = new McpRegistry();

// 서버 등록 — 프로세스 spawn + 연결 + 도구 디스커버리
await registry.register({
  name: 'nebula',
  command: 'node',
  args: ['packages/mcp-server/dist/cli.js'],
});

// 통합 도구 목록 — "serverName.toolName" 형식
registry.listTools();
// → [{ qualifiedName: "nebula.read_file", ... }, ...]

// 도구 호출 — 서버 자동 라우팅
await registry.callTool('read_file', { path: 'CLAUDE.md' });
```

### 도구 이름 해석 전략

1. `nebula.read_file` → "nebula" 서버의 "read_file" 도구 (명시적)
2. `read_file` → 도구를 가진 첫 번째 서버에서 실행 (편의)

## 보안 고려사항

### `run_command` 도구
- 임의의 셸 명령을 실행할 수 있음 — **Agent의 판단에 의존**
- 타임아웃 기본 30초 (무한 루프 방지)
- maxBuffer 1MB (메모리 보호)
- 추후: 허용 명령 화이트리스트, 샌드박스 실행 검토

### `web_search` 도구
- Tavily API 키 필요 (환경변수)
- API 호출 비용 발생 — Agent에게 불필요한 검색 자제 지시 필요

## 기술 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| MCP SDK | `@modelcontextprotocol/sdk` | JSON-RPC 직접 구현 대비 안정성 + 시간 절약 |
| Transport | stdio | 로컬 프로세스 간 통신, 가장 단순하고 안정적 |
| 도구 스키마 | Zod | SDK와 네이티브 통합, 런타임 검증 |
| 도메인 | 개발 워크플로우 | "나만의 Claude Code" 서사, 도구 다양성 |
