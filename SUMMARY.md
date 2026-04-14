# Nebula — 요약

> 한 줄씩 훑어보는 프로젝트 진행 상황

## 완료

- **@nebula/ai** — Gemini + Voyage 게이트웨이, Forge에서 이관. 스트리밍, 배칭, 비용 계산 포함
- **@nebula/shared** — 환경변수 파싱 (GOOGLE_API_KEY, VOYAGE_API_KEY)
- **@nebula/mcp-server** — 6개 도구 MCP 서버 (read_file, list_directory, grep_search, write_file, run_command, web_search)
- **@nebula/mcp-client** — 멀티 서버 레지스트리 (McpRegistry), 도구 디스커버리 + 라우팅
- **모노레포 인프라** — pnpm workspace, TypeScript strict, ESM
- **지식 맵** — CLAUDE.md 진입점 + docs/ 하위 구조 (설계문서, 명세, 실행계획, 참고자료)

- **@nebula/ai function calling** — Gemini function calling 지원 (AiFunctionDeclaration, AiPart, 멀티턴 도구 대화)
- **@nebula/agent** — Agent Loop 직접 구현 (think→act→observe), AsyncIterable 이벤트 스트리밍
- **apps/api** — Fastify + SSE 스트리밍 (POST /agent/run), graceful shutdown

- **apps/web** — Next.js + React Flow 실시간 Agent 시각화, 채팅 UI
- **멀티턴 대화** — 서버 in-memory 대화 저장소, conversationId 기반 대화 이어가기
- **스트리밍 delta** — streamChat() 함수로 글자 단위 실시간 스트리밍 (chat() → streamChat() 전환)
- **에러 UI** — ErrorCode 체계 (rate_limit/server_error 등), 한국어 메시지, 재시도 버튼

## 진행 예정

- **배포** — Docker multi-stage + GitHub Actions CI/CD
- **테스트** — Vitest 단위/통합 테스트

//nebula 프로젝트의 packages 폴더 구조를 확인하고, 각 패키지의 package.json에서 이름과 버전을 정리해줘
