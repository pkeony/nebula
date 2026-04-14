# Nebula

> AI Agent 플랫폼 — MCP 프로토콜 양쪽 구현, Agent Loop 직접 구현, 실시간 시각화

LLM Agent가 외부 도구를 자율적으로 선택·실행하는 플랫폼.
LangChain/LangGraph 없이 Agent Loop(think→act→observe)를 직접 구현하고,
MCP(Model Context Protocol)의 서버·클라이언트 양쪽을 모두 구축했습니다.

**핵심 서사: "나만의 Claude Code를 만든다"**

## 아키텍처

```
Browser ──POST /agent/run──> API (Fastify) ──execute──> AgentExecutor
   ◄──── SSE stream ────────      ◄──events────  │
                                                  ├── THINK ──> @nebula/ai (Gemini)
                                                  ├── ACT ────> McpRegistry
                                                  │               ├── stdio ──> nebula-mcp-server
                                                  │               └── stdio ──> (외부 MCP 서버)
                                                  └── OBSERVE ──> loop back
```

## 패키지 구조

```
nebula/
├── packages/
│   ├── ai/              @nebula/ai — LLM 게이트웨이 (Gemini, Voyage)
│   ├── mcp-server/      @nebula/mcp-server — 커스텀 MCP 서버 (6개 도구)
│   ├── mcp-client/      @nebula/mcp-client — 멀티 서버 레지스트리
│   ├── agent/           @nebula/agent — Agent Loop (think→act→observe)
│   └── shared/          @nebula/shared — 환경변수, 공통 타입
├── apps/
│   ├── api/             Fastify + SSE 스트리밍
│   └── web/             Next.js + React Flow 시각화
└── docs/                설계문서, 명세, 실행계획
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
| 프론트엔드 | Next.js + React Flow |
| 스트리밍 | SSE (AsyncIterable) |
| 스키마 | Zod |
| 테스트 | Vitest |
| 컨테이너 | Docker (multi-stage build) |
| CI/CD | GitHub Actions |

## 시작하기

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# GOOGLE_API_KEY, VOYAGE_API_KEY 등 설정

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 테스트
pnpm test

# 타입 체크
pnpm typecheck
```

## 주요 기능

- **Agent Loop** — think→act→observe 사이클 직접 구현, AsyncIterable 이벤트 스트리밍
- **MCP 서버** — read_file, write_file, grep_search, list_directory, run_command, web_search
- **MCP 클라이언트** — 멀티 서버 레지스트리, 도구 디스커버리, qualified name 라우팅
- **실시간 시각화** — React Flow 커스텀 노드/엣지, ZigzagEdge, Lumina 디자인 시스템
- **멀티턴 대화** — 서버 사이드 대화 저장소, conversationId 기반 대화 이어가기
- **스트리밍** — streamChat() 글자 단위 실시간 스트리밍, SSE 전송
- **에러 복구** — Rate limit/서버 에러 자동 분류 + 백오프 재시도
- **보안** — run_command 화이트리스트, Path Guard, 스키마 새니타이제이션

## Docker

```bash
# Docker Compose로 실행
docker compose up --build

# 개별 빌드
docker build -f apps/api/Dockerfile -t nebula-api .
docker build -f apps/web/Dockerfile -t nebula-web .
```

## 프로젝트 문서

- [ARCHITECTURE.md](ARCHITECTURE.md) — 시스템 아키텍처, 데이터 흐름
- [PORTFOLIO.md](PORTFOLIO.md) — 프로젝트 상세 포트폴리오
- [DECISION.md](DECISION.md) — 기술 결정 기록 (ADR)
- [INTERVIEW_NOTES.md](INTERVIEW_NOTES.md) — 면접 대비 기술 노트
- [SECURITY.md](SECURITY.md) — 보안 규칙, 접근 제어

## License

MIT
