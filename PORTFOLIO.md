# Nebula — 포트폴리오

> AI Agent 플랫폼 — MCP 프로토콜 양쪽 구현, Agent Loop 직접 구현, 실시간 시각화
> 프로젝트 기간: 2026-04-12 ~

---

## 프로젝트 소개

Nebula는 **LLM Agent가 외부 도구를 자율적으로 선택·실행하는 플랫폼**이다.
LangChain/LangGraph 같은 프레임워크 없이 Agent Loop(think→act→observe)를 직접 구현하고,
MCP(Model Context Protocol) 프로토콜의 서버·클라이언트 양쪽을 모두 직접 구축한다.

**핵심 서사: "나만의 Claude Code를 만든다"**
— Claude Code가 MCP 서버를 연결해 도구를 쓰는 것처럼,
Nebula Agent도 MCP 서버들을 연결해 파일 읽기, 검색, 코드 실행, 웹 검색을 자율적으로 수행한다.

---

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| 런타임 | Node.js 22+ (ESM) | 최신 ESM 네이티브, top-level await |
| 언어 | TypeScript strict (`any` 금지) | 타입 안전성 + 면접에서 strict 경험 어필 |
| 모노레포 | pnpm workspace | 패키지 간 의존성 명시적 관리, 빌드 속도 |
| MCP | `@modelcontextprotocol/sdk` | Anthropic 공식 SDK, JSON-RPC 직접 구현 대비 안정성 |
| LLM | Gemini (via @nebula/ai) | 비용 효율, 긴 컨텍스트 |
| Embedding | Voyage code-3 | 코드 특화 임베딩, Forge 프로젝트에서 검증 |
| API | Fastify | Express 대비 2~3x 빠름, 스키마 퍼스트 |
| 프론트엔드 | Next.js + React Flow | Agent 실행 흐름 실시간 시각화 |
| 스트리밍 | SSE (AsyncIterable) | WebSocket 대비 단순, 단방향 스트림에 적합 |
| 스키마 | Zod | 런타임 검증 + MCP SDK 네이티브 통합 |

---

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

### 패키지 구조

```
nebula/
├── packages/
│   ├── ai/          — @nebula/ai      LLM 게이트웨이 (Gemini, Voyage)
│   ├── mcp-server/  — @nebula/mcp     커스텀 MCP 서버 (6개 도구)
│   ├── mcp-client/  — @nebula/mcp     멀티 서버 레지스트리
│   ├── agent/       — @nebula/agent   Agent Loop (think→act→observe)
│   └── shared/      — @nebula/shared  환경변수, 공통 타입
├── apps/
│   ├── api/         — Fastify + SSE 스트리밍
│   └── web/         — Next.js + React Flow 시각화
└── docs/            — 지식 맵 (설계문서, 명세, 실행계획)
```

---

## 개발 워크플로우: Claude Code 협업 기반 개발

이 프로젝트는 **Claude Code를 개발 파트너로 활용**하는 워크플로우를 의도적으로 채택했다.
단순 코드 생성이 아니라, AI와 함께 설계→구현→검증 사이클을 돌리는 방법론이다.

### 바이브코딩 + 개발자 규칙

"바이브코딩"이라 불리는 AI 협업 개발에서 **품질을 지키기 위해 설정한 규칙들:**

1. **지식 맵 우선 (CLAUDE.md 체계)**
   - 프로젝트 루트 CLAUDE.md를 "안내판"으로 설계
   - 모든 상세는 하위 문서로 분리 → 컨텍스트 예산 절약
   - AI가 매 세션 자동 로드하되, 필요한 문서만 점진적으로 열도록 유도

2. **TypeScript strict + `any` 금지**
   - AI가 생성한 코드도 예외 없이 strict 적용
   - 타입 안전성이 깨지면 즉시 수정 — 나중에 고치기 어려움

3. **LLM SDK 직접 import 금지**
   - 도메인 코드에서 `@google/generative-ai` 직접 호출 불가
   - 반드시 `@nebula/ai` 게이트웨이 경유 → 모델 교체 시 한 곳만 수정

4. **Plan 모드 → 합의 → 실행**
   - 큰 피처는 반드시 Plan 모드에서 설계 합의 후 코딩 시작
   - 사전 합의 없는 아키텍처 결정 금지

5. **한 세션 한 피처**
   - 세션 경계를 명확히 해서 컨텍스트 오염 방지
   - 각 세션은 독립적으로 완결되는 단위

### Hooks — 자동 품질 체크 + 안전망

`.claude/hooks.json`으로 Claude Code 이벤트에 셸 커맨드를 바인딩:

| 이벤트 | matcher | 동작 | 목적 |
|--------|---------|------|------|
| `PreToolUse` | `Bash` | `rm -rf`, `--force`, `--hard` 등 감지 시 차단 | 파괴적 명령 안전망 |
| `PostToolUse` | `Edit\|Write` | `pnpm tsc --noEmit` 자동 실행 (30s timeout) | 파일 수정 즉시 타입 체크 |

**설계 포인트:**
- git pre-commit hook(husky)과 Claude Code hooks는 **레이어가 다름** — 전자는 커밋 시점, 후자는 도구 사용 시점
- PreToolUse로 파괴적 명령을 **실행 전에** 차단 — settings.json deny와 이중 방어

### Settings — 프로젝트별 권한 경계

`.claude/settings.json`으로 도구 권한을 프로젝트 단위로 선언:

| 구분 | 규칙 | 효과 |
|------|------|------|
| allow | `Read`, `Glob`, `Grep`, `Bash(pnpm *)`, `Bash(git status/log/diff*)` | 안전한 도구 자동 허용 → 매 세션 클릭 제거 |
| deny | `Bash(rm -rf *)`, `Bash(git push --force*)`, `Bash(git reset --hard*)` | 위험 명령 원천 차단 |

**면접 어필:** "프로젝트별 보안 경계를 선언적으로 설정하면서 DX를 최적화"

### Skill / Slash Command 활용

**빌트인 Skill:**

| Skill | 용도 | 사용 시점 |
|-------|------|-----------|
| `/commit` | 커밋 메시지 자동 생성 | 피처 완료 시 |
| `/review-pr` | PR 리뷰 | 코드 병합 전 |
| `explain-code` | 코드 설명 + 다이어그램 | 복잡한 로직 이해 |
| `simplify` | 코드 품질 개선 | 큰 변경 후 |

**커스텀 Slash Command (`.claude/commands/`):**

| 커맨드 | 파일 | 동작 |
|--------|------|------|
| `/build` | `build.md` | `pnpm --filter $ARGUMENTS build` — 패키지별 또는 전체 빌드 |
| `/test` | `test.md` | `pnpm --filter $ARGUMENTS test` — 실패 시 원인 분석 + 수정 |
| `/check` | `check.md` | tsc → lint → test 순차 실행 — 한방 품질 체크 |

### Agent 활용 패턴

| Agent 타입 | 용도 | 실제 사용 예 |
|-----------|------|-------------|
| **Explore** | 코드베이스 탐색 위임 | 3개 이상 파일 탐색 시 메인 컨텍스트 보호 |
| **code-reviewer** | 독립 코드 리뷰 | 5+ 파일 변경, 보안 민감 로직 수정 후 |
| **Plan** | 아키텍처 설계 | 새 패키지 생성, 큰 기능 설계 |
| **general-purpose** | 복잡한 멀티스텝 작업 | 리서치 + 구현이 혼합된 작업 |

### MCP 활용

프로젝트 자체가 MCP를 구현하면서, 동시에 Claude Code의 MCP 기능도 활용:
- **Figma MCP**: UI 디자인 → 코드 변환 워크플로우
- **GitHub MCP**: PR 생성, 이슈 관리 자동화

---

## 기획 단계에서의 핵심 고민

### 1. 프레임워크 vs 직접 구현

**결정: Agent Loop 직접 구현 (LangChain 미사용)**

- LangChain/LangGraph는 빠르지만 내부 동작이 블랙박스
- 면접에서 "프레임워크 내부를 이해하고 있다"는 차별화 포인트
- think→act→observe 사이클을 직접 제어해야 커스텀 가능 (토큰 최적화, 도구 선택 로직 등)
- 이전 프로젝트(Forge)에서도 같은 철학: RAG를 직접 구현해서 동작 원리 체득

### 2. MCP 프로토콜 양쪽 구현

**결정: 서버 + 클라이언트 모두 직접 구현**

- 서버만 만들면 "API 감싸기"에 불과
- 클라이언트까지 만들어야 **"멀티 서버 통합 라우팅"** 이라는 실전 과제를 경험
- Claude Code가 MCP를 쓰는 방식을 직접 재현 → 프로토콜 깊은 이해

### 3. 스트리밍 방식 선택

**결정: SSE (Server-Sent Events)**

- Agent 실행은 **단방향 스트림** (서버→클라이언트)
- WebSocket은 양방향이지만 Agent 시나리오에서 과잉
- SSE는 HTTP 기반이라 프록시/로드밸런서 친화적
- AsyncIterable 패턴과 자연스럽게 연결

### 4. 모노레포 패키지 경계

**결정: 도메인별 명확 분리**

- `@nebula/ai`: LLM 호출 추상화 — 모델 교체 시 이 패키지만 수정
- `@nebula/mcp-*`: 프로토콜 계층 — Agent와 독립적으로 테스트 가능
- `@nebula/agent`: 핵심 비즈니스 로직 — LLM과 도구를 오케스트레이션
- 각 패키지가 독립 빌드·테스트 가능 → CI 최적화

### 5. 지식 맵 구조

**결정: CLAUDE.md 진입점 + docs/ 하위 구조**

- 프로젝트 지식을 AI가 효율적으로 소비하도록 설계
- 모든 문서를 한 파일에 넣으면 컨텍스트 낭비 → 필요한 것만 점진적 로드
- 설계문서(ADR), 제품명세, 실행계획, 참고자료 분리

---

## 구현 상세

### Phase 1: 프로젝트 초기화 + AI 패키지 이관

**커밋:** `025f1b3` Nebula 프로젝트 초기화: @nebula/ai 패키지 이관

- Forge 프로젝트에서 `@forge/ai` → `@nebula/ai`로 이관
- Gemini 2.5-flash / 3-flash-preview 지원
- Voyage code-3 임베딩 (자동 배칭: ≤32개/요청, ≤30k 토큰/요청)
- 토큰 비용 계산 (pricing 모듈)
- 모델 라우팅 (complexity 기반)

### Phase 2: 모노레포 인프라 + MCP 구현

**커밋:** `2e9273f` 모노레포 인프라 세팅
**커밋:** `2a783e5` MCP 서버(6개 도구) + 클라이언트(McpRegistry) 구현

**MCP 서버 — 6개 도구:**

| 도구 | 기능 | 보안 고려 |
|------|------|-----------|
| `read_file` | 파일 읽기 | 경로 접근 제어 필요 |
| `list_directory` | 디렉토리 탐색 | — |
| `grep_search` | 재귀 텍스트 검색 (최대 50건) | node_modules/.git 자동 제외 |
| `write_file` | 파일 쓰기 (mkdir -p) | 쓰기 권한 범위 제한 필요 |
| `run_command` | 셸 명령 실행 (30s 타임아웃) | 화이트리스트 검토 예정 |
| `web_search` | Tavily API 웹 검색 | API 비용, 호출 빈도 제한 |

**MCP 클라이언트 — McpRegistry:**
- 멀티 서버 동시 연결
- 도구 디스커버리 자동화
- Qualified name 라우팅 (`server.tool`)
- 서버 등록/해제/정리 생명주기

### Phase 3: Agent Loop + API

**@nebula/ai 확장 — function calling 지원:**
- `AiFunctionDeclaration`, `AiFunctionCall`, `AiFunctionResponse` 도메인 타입
- `AiPart` 유니온으로 멀티턴 도구 대화 지원 (text | functionCall | functionResponse)
- `chat()`에 Gemini function calling 통합 — tools, toolConfig 전달, functionCalls 응답 추출
- MCP Tool inputSchema → Gemini FunctionDeclarationSchema 변환 (타입가드 기반)

**@nebula/agent — Agent Loop 직접 구현:**
- `execute()` 비동기 제너레이터 — `AsyncIterable<AgentEvent>` 반환
- think→act→observe 사이클: LLM 호출 → functionCall 감지 → McpRegistry.callTool() → 결과 피드백
- 6종 이벤트 스트림: thinking, tool_call, tool_result, delta, done, error
- AbortSignal 기반 취소, maxIterations 제한, 사용량 누적
- 도구 실행 실패 시 에러를 functionResponse로 LLM에 전달 (자율 복구)

**apps/api — Fastify + SSE 스트리밍:**
- `POST /agent/run` — SSE 스트리밍 엔드포인트
- Zod 요청 검증 (message 길이 제한 10,000자)
- MCP 서버 설정 서버 사이드 전용 (RCE 취약점 차단)
- reply.raw 직접 사용 (SSE 플러그인 불필요)
- graceful shutdown (SIGINT/SIGTERM)
- 클라이언트 disconnect 시 AbortController로 Agent 중단

**code-reviewer 독립 리뷰 → 4건 수정:**
- RCE 취약점 제거 (mcpServers 클라이언트 입력 차단)
- tool result text 방어 처리 (non-text content 필터링)
- convert-tools 타입가드 적용 (캐스팅 제거)
- graceful shutdown 추가

### Phase 4: 프론트엔드 + 시각화

**커밋:** `8368caf` 프론트엔드 — Next.js + React Flow 실시간 Agent 시각화

- `apps/web/` — Next.js 15 + React 19
- React Flow(@xyflow/react)로 Agent 실행 흐름 실시간 시각화
- 7종 커스텀 노드: Start, Thinking, ToolCall, ToolResult, Response, Done, Error
- 채팅 UI — MessageBubble, ChatInput, MessageList
- SSE 클라이언트 — fetch + ReadableStream (EventSource는 GET 전용)
- useAgentStream 리듀서 — 이벤트 → 메시지 누적 + 상태 관리
- 다크 테마 CSS 변수 시스템

### Phase 5: 멀티턴 대화 + 스트리밍 + 에러 UI

**멀티턴 대화 — 서버 사이드 대화 저장소:**
- In-memory `Map<conversationId, Conversation>` — TTL 1시간, 5분 간격 정리
- `POST /agent/run` 확장: `{ message, conversationId? }` → 대화 이어가기
- Agent executor 시그니처 변경: `execute(userMessage)` → `execute(messages[])` — 전체 이력 전달
- 프론트엔드: done 이벤트에서 conversationId 수신 → 다음 요청에 자동 포함
- "New Chat" 시 conversationId 리셋 → 새 대화 시작

**스트리밍 delta — streamChat() 함수:**
- `@nebula/ai`에 `streamChat()` 추가 — `generateContentStream` + functionCall 감지
- `StreamChatEvent` 타입: delta(글자 단위) | function_calls(도구 호출) | done(완료)
- Agent executor를 `chat()` → `streamChat()`으로 전환
- 텍스트 delta 실시간 yield + 스트림 종료 후 functionCall 일괄 처리
- thinking 텍스트도 실시간 스트리밍 가능

**에러 UI — ErrorCode 체계:**
- `ErrorCode` 타입: `rate_limit | server_error | validation | timeout | aborted | unknown`
- Gemini API 에러 → ErrorCode 자동 매핑 (429→rate_limit, 503→server_error)
- `retryable` 플래그 → 프론트엔드 "다시 시도" 버튼 조건부 표시
- HTTP 에러(SSE 연결 전)와 스트리밍 중 에러 통합 처리
- 에러 코드별 한국어 메시지 (사용자 친화적 UX)

### Phase 6: 외부 MCP 서버 연동 + Agent 고도화

**커밋:** `162dc34` Phase 6: 외부 MCP 서버 연동 + Agent 고도화

**설정 기반 외부 MCP 서버 로드:**
- `mcp-servers.json` 설정 파일에서 서버 목록 동적 로드 (name, command, args, env, enabled)
- 개별 서버 연결 실패 시 다른 서버에 영향 없음 (격리)
- Anthropic 공식 MCP 서버 연동 가능 (filesystem, github 등)

**멀티 서버 도구 이름 충돌 해결:**
- Gemini는 dot(`.`)을 함수명에 허용하지 않음 → `"nebula.read_file"` → `"nebula__read_file"` 변환
- 역매핑으로 함수 호출 후 원래 qualified name으로 McpRegistry 라우팅

**스키마 새니타이제이션:**
- 외부 MCP 서버 JSON Schema에 Gemini 미지원 필드 포함 (`additionalProperties`, `$schema`, `anyOf` 등)
- 화이트리스트 기반 재귀 필터링으로 호환 스키마 생성

**LLM 에러 자동 복구:**
- 에러 분류: 429→rate_limit, 503→server_error, abort→aborted
- 백오프 2초 대기 후 1회 재시도 (MAX_LLM_RETRIES=1)

**컨텍스트 윈도우 관리:**
- 50,000자 초과 시 오래된 도구 결과부터 축약 (최근 4개 보존)
- 장기 대화에서 토큰 비용 최적화

### Phase 7: UI/UX 강화

**커밋:** `9b5f75a` Phase 7: UI/UX 강화 — 사이드바, 도구 상세 뷰, 레이아웃 개선

**대화 히스토리 사이드바:**
- `useSessions` 훅으로 세션 관리 (생성/전환/삭제)
- 세션 전환 시 `AgentStreamState` 스냅샷 저장/복원
- 첫 메시지 40자로 자동 제목 생성

**ToolCallNode 상세 뷰:**
- 도구 호출 노드 클릭 시 expandable detail view
- 도구명, 인자(`args`) 전체 내용 스크롤 가능

**레이아웃 개선:**
- 좌→우 wrap 레이아웃 (MAX_PER_ROW=4)
- React Flow `setCenter()`로 최신 노드 자동 추적

### Phase 8: Lumina 디자인 시스템

**커밋:** `06e06ec` Lumina 디자인 시스템 오버홀 — 라이트 테마 + 에디토리얼 UI

- 다크→라이트 테마 전환 (CSS 변수 시스템)
- 듀얼 폰트: Manrope(헤드라인) + Inter(본문)
- No-Line Rule: 보더 제거, 배경색 대비 + ambient shadow로 대체
- Glassmorphic 입력창 (`backdrop-filter: blur()`)
- Material Symbols 아이콘 통합

### Phase 9: Process Flow 패널 + 에디토리얼 리디자인

**커밋:** `b0165f6` Process Flow 패널 + 채팅 UI 에디토리얼 리디자인

**ProcessTimeline 우측 패널:**
- 독립 우측 패널 (`w-96`), 이벤트 없으면 숨김
- 같은 도구 연속 호출 시 그룹핑 (예: "read_file 3/3 완료")
- Material Icons + Status Badge (done/active/error)

**레이아웃:**
- `h-screen` 고정 + 패널별 독립 스크롤
- 채팅 입력 항상 하단 고정

### Phase 10: Flow 시각화 리디자인

**커밋:** `63c84e8` ~ `a95527d` (7개 커밋)

**세로 레이아웃:**
- 상→하 세로 흐름 (start → thinking → response → done)
- 도구 페어링: tool_call(좌) ↔ tool_result(우) 수평 정렬

**ZigzagEdge 커스텀 엣지:**
- SVG path로 ㄱ자 직각 꺾임 구현
- 세로/크로스 엣지와 가로 엣지 분리

**전체 화면 모달:**
- "View Flow Detail" 클릭 시 `backdrop-blur-sm` 모달
- Glass 스타일 카드, Material Icons, 컬러 코딩

### Phase 11: 랜딩페이지 + UI 한글화 + Claude Code 세팅

**커밋:** `db6d291` 랜딩페이지 + UI 한글화 + Claude Code 프로젝트 세팅

**포트폴리오형 랜딩페이지:**
- `/` → 랜딩페이지 (Hero, Features, Tech Stack, CTA)
- `/chat` → 채팅 UI (기존 기능)
- Scroll-triggered reveal animation (IntersectionObserver)
- Pretendard 한글 폰트

**전체 UI 한글화:**
- 34개 텍스트 문자열 영어→한글 전환
- 도구명: "read_file" → "파일 읽기 (read_file)" 한영 병기

**Claude Code 프로젝트 세팅:**
- `.claude/hooks.json`: PreToolUse(파괴적 명령 차단) + PostToolUse(tsc 자동 실행)
- `.claude/settings.json`: allow/deny 도구 권한 경계
- `.claude/commands/`: `/build`, `/test`, `/check` 커스텀 slash command

### Phase 12: Vitest 테스트

**커밋:** `3775e97` Vitest 테스트 세팅 + 핵심 패키지 단위 테스트 22개

- `@nebula/ai` 15개: 비용 계산(모델별 정확 비용, 엣지케이스), 모델 라우팅
- `@nebula/agent` 7개: MCP→Gemini 스키마 변환, 이름 매핑, 새니타이제이션
- 패키지별 독립 테스트 + 루트 통합 실행 (`pnpm test`)

### Phase 13: 도구 이름 한글화 + 대화 도구 사용 요약

**커밋:** `8c620aa` 도구 이름 한글화 + 대화 영역에 도구 사용 요약 표시

- `tool-labels.ts` 공유 유틸: 11개 도구 한영 병기 레이블
- MessageBubble에 도구 사용 요약 배지 (예: "파일 읽기 ×3")
- `useAgentStream` 리듀서에서 done 이벤트 시 도구 사용 집계

### Phase 14: Docker + CI/CD 파이프라인

**커밋:** `33a0be2` Docker + CI/CD 파이프라인 세팅

**GitHub Actions CI:**
- main 브랜치 push/PR 트리거
- typecheck → test → build 순차 실행
- pnpm cache 활용

**Docker Multi-stage Build:**
- API: deps → build → runner 3단계 (prod 의존성 + dist만 포함)
- Web: Next.js standalone 빌드 + 비루트 유저(`nextjs:nodejs`) 보안 강화
- Docker Compose: api(4000) + web(3000) 구성

### Phase 15: 보안 강화

**커밋:** `953c646` 보안 강화 — run_command 화이트리스트 + 파일 경로 접근 제어

**run_command 화이트리스트:**
- 허용 명령어 접두사 (ls, cat, grep, node, git log 등)
- 차단 패턴 (rm -rf, sudo, chmod, curl|sh 등)
- Double Layer: 차단 패턴 + 화이트리스트 (방어 깊이)

**Path Guard (파일 접근 제어):**
- path traversal 방지 (`../../etc/passwd` 차단)
- 민감 파일 패턴 차단 (`.env`, `.ssh`, `.aws`)
- `allowedRoot` 기반 경로 범위 제한

**보안 테스트 43개 추가:**
- path traversal, 파이프 주입, 민감 파일 접근 등 검증

---

## 이전 프로젝트와의 연결

| 영역 | Forge (1st 프로젝트) | Nebula (2nd 프로젝트) |
|------|---------------------|----------------------|
| LLM 추상화 | @forge/ai (Gemini + Voyage) | @nebula/ai (이관 + 확장) |
| 핵심 기능 | RAG + Vector DB + Eval | Agent Loop + MCP + 시각화 |
| 프레임워크 | 직접 구현 (LangChain X) | 직접 구현 (LangChain X) |
| 학습 포인트 | RAG 파이프라인, 비용 최적화 | MCP 프로토콜, Agent 패턴, 스트리밍 |

**포트폴리오 3종 세트:**
1. ✅ Forge — RAG / Vector DB / Eval
2. 🔥 Nebula — Agent / MCP / Tool Use
3. (다음) — 미정

---

## 면접 어필 포인트

1. **"프레임워크 없이 Agent Loop 직접 구현"**
   - think→act→observe 사이클의 원리를 코드 레벨에서 설명 가능
   - 토큰 최적화, 도구 선택 전략 등 프로덕션 고민

2. **"MCP 프로토콜 양쪽 구현"**
   - 서버(도구 제공자)와 클라이언트(도구 소비자) 모두 경험
   - 멀티 서버 통합 라우팅이라는 실전 과제 해결

3. **"프로덕션 Agent 패턴"**
   - Rate limit/서버 에러 자동 분류 + 백오프 재시도
   - 외부 API 스키마를 LLM 호환 형식으로 변환 (새니타이제이션)
   - 컨텍스트 윈도우 최적화 — 50K자 초과 시 선택적 트리밍

4. **"보안 아키텍처"**
   - run_command 화이트리스트 + Path Guard 이중 방어
   - RCE 취약점 원천 차단 (mcpServers 클라이언트 입력 제거)
   - 43개 보안 테스트로 공격 시나리오 검증

5. **"Claude Code 워크플로우 마스터리"**
   - AI 도구를 단순 코드 생성이 아닌 설계·검증 파트너로 활용
   - Plan 모드, Agent 위임, Skill 시스템 등 고급 기능 실전 적용
   - hooks.json + settings.json으로 자동 품질 체크 + 보안 경계

6. **"모노레포 패키지 설계"**
   - 관심사 분리: AI, Protocol, Agent, Shared
   - 각 패키지 독립 빌드·테스트 → CI 최적화

7. **"스트리밍 기반 실시간 시각화"**
   - SSE + AsyncIterable 패턴
   - React Flow 커스텀 노드/엣지 (ZigzagEdge, Lumina 디자인)

8. **"DevOps 파이프라인"**
   - Docker multi-stage 빌드 (이미지 최적화)
   - GitHub Actions CI (typecheck → test → build)
   - 비루트 유저 실행, .dockerignore 보안
