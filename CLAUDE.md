# Nebula — 프로젝트 규칙

> AI Agent 플랫폼 — MCP 클라이언트 멀티 연결, Agent loop 직접 구현, 실시간 시각화

## 스택 (예정)
- **런타임:** Node.js (ESM)
- **언어:** TypeScript strict (`any` 금지)
- **패키지 매니저:** pnpm + workspace
- **모노레포 구조:** `packages/` (공유 패키지), `apps/` (서비스)

## 현재 상태
- `ai/` — Forge에서 이관한 AI 게이트웨이 패키지 (`@nebula/ai`)
  - Gemini chat/stream, Voyage embedding, 모델 라우팅, 가격 계산
- 아키텍처 미확정 — 별도 Plan 세션에서 설계 예정

## 규칙
- LLM SDK 직접 import 금지 — 도메인 코드는 `@nebula/ai` 경유
- `@forge/*` 참조 금지 — 모든 Forge 의존성은 Nebula 자체로 교체
- 커밋 메시지 한국어 본문, 영어 식별자
