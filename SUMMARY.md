# Nebula — 요약

> 한 줄씩 훑어보는 프로젝트 진행 상황

## 완료

- **@nebula/ai** — Gemini + Voyage 게이트웨이, Forge에서 이관. 스트리밍, 배칭, 비용 계산 포함
- **@nebula/shared** — 환경변수 파싱 (GOOGLE_API_KEY, VOYAGE_API_KEY)
- **@nebula/mcp-server** — 6개 도구 MCP 서버 (read_file, list_directory, grep_search, write_file, run_command, web_search)
- **@nebula/mcp-client** — 멀티 서버 레지스트리 (McpRegistry), 도구 디스커버리 + 라우팅
- **모노레포 인프라** — pnpm workspace, TypeScript strict, ESM

- **@nebula/ai function calling** — Gemini function calling 지원 (AiFunctionDeclaration, AiPart, 멀티턴 도구 대화)
- **@nebula/agent** — Agent Loop 직접 구현 (think→act→observe), AsyncIterable 이벤트 스트리밍
- **apps/api** — Fastify + SSE 스트리밍 (POST /agent/run), graceful shutdown

- **apps/web** — Next.js + React Flow 실시간 Agent 시각화, 채팅 UI
- **멀티턴 대화** — 서버 in-memory 대화 저장소, conversationId 기반 대화 이어가기
- **스트리밍 delta** — streamChat() 함수로 글자 단위 실시간 스트리밍 (chat() → streamChat() 전환)
- **에러 UI** — ErrorCode 체계 (rate_limit/server_error 등), 한국어 메시지, 재시도 버튼

- **외부 MCP 서버 연동** — Agent 고도화, 외부 서버 통합
- **UI/UX 강화** — 사이드바, 도구 그룹화, 마크다운 렌더링, 탭 전환, 도구 상세 뷰
- **Lumina 디자인 시스템** — 라이트 테마 + 에디토리얼 UI 오버홀
- **Flow 시각화 리디자인** — 세로 레이아웃, ZigzagEdge 커스텀 엣지, Lumina 노드
- **랜딩페이지 + UI 한글화** — 프로젝트 소개 페이지, 도구 이름 한글화, 대화 영역 도구 사용 요약
- **Vitest 테스트** — 핵심 패키지 단위 테스트 22개
- **Docker + CI/CD** — Docker multi-stage 빌드 + GitHub Actions 파이프라인
- **보안 강화** — run_command 화이트리스트 + 파일 경로 접근 제어
