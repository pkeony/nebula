# Nebula — 아키텍처

> AI Agent 플랫폼 — MCP 프로토콜 양쪽 구현, Agent Loop 직접 구현, 실시간 시각화

## 패키지 구조

```
nebula/
├── packages/
│   ├── ai/              ← @nebula/ai — LLM 게이트웨이 (Gemini, Voyage)
│   ├── mcp-server/      ← @nebula/mcp-server — 커스텀 MCP 서버
│   ├── mcp-client/      ← @nebula/mcp-client — 멀티 서버 연결
│   ├── agent/           ← @nebula/agent — Agent Loop (핵심)
│   └── shared/          ← @nebula/shared — env, logger, 공통 타입
├── apps/
│   ├── api/             ← Fastify — Agent 실행 API, SSE 스트리밍
│   └── web/             ← Next.js — React Flow 시각화, 채팅 UI
└── docs/                ← 지식 맵
```

## 핵심 컴포넌트

### Agent Loop (`@nebula/agent`)
```
User Message → THINK (LLM) → ACT (tool_use) → OBSERVE (결과) → LOOP or RESPOND
```
- `AgentExecutor`: max iterations, abort signal, 이벤트 emit
- `AgentEvent`: thinking | tool_call | tool_result | delta | done | error

### MCP Client (`@nebula/mcp-client`)
- `McpRegistry`: 멀티 서버 등록/해제, 도구 디스커버리
- Transport: stdio (로컬), Streamable HTTP (리모트)

### MCP Server (`@nebula/mcp-server`)
- `@modelcontextprotocol/sdk` 기반
- 초기 도구: read_file, list_directory, web_search

## 데이터 흐름

```
Browser ──POST /agent/run──> API ──execute──> Agent ──LLM call──> @nebula/ai
   ◄──── SSE stream ────────  ◄──events────   ├──callTool──> MCP Client ──> MCP Servers
                                               └──observe──> loop back
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Node.js 22+ (ESM) |
| 언어 | TypeScript strict |
| 패키지 매니저 | pnpm workspace |
| MCP | @modelcontextprotocol/sdk |
| LLM | Gemini (via @nebula/ai) |
| API | Fastify |
| 프론트 | Next.js + React Flow |
| 스트리밍 | SSE (AsyncIterable) |
| 스키마 | Zod |
