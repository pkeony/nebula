# Nebula — 진입점

> 이 파일은 **안내판**이다. 모든 상세를 여기에 담지 않는다.
> 필요한 하위 문서만 점진적으로 열어 컨텍스트 예산을 아낀다.

## 프로젝트 개요
AI Agent 플랫폼 — MCP 클라이언트 멀티 연결, Agent loop 직접 구현, 실시간 시각화

## 먼저 읽을 것
- [ARCHITECTURE.md](ARCHITECTURE.md) — 시스템 아키텍처, 패키지 구조, 데이터 흐름

## 상세 문서 (필요할 때만)
- [docs/design-docs/](docs/design-docs/) — 설계 문서 (ADR, 기술 설계)
- [docs/product-specs/](docs/product-specs/) — 수용 기준, 기능 명세
- [docs/exec-plans/](docs/exec-plans/) — 실행 계획
- [docs/references/](docs/references/) — 참고 자료, 외부 API 문서 요약

## 품질 & 보안
- [QUALITY_SCORE.md](QUALITY_SCORE.md) — 코드 품질 기준, 체크리스트
- [SECURITY.md](SECURITY.md) — 보안 규칙, API 키 관리, 인증 정책

## 면접 & 포트폴리오
- [INTERVIEW_NOTES.md](INTERVIEW_NOTES.md) — 면접 대비 기술 노트 (실전 이슈 + 면접 질문 연결)
- [PORTFOLIO.md](PORTFOLIO.md) — 프로젝트 상세 포트폴리오
- [DECISION.md](DECISION.md) — 기술 결정 기록 (ADR)

## 규칙
- **스택:** Node.js (ESM), TypeScript strict (`any` 금지), pnpm workspace
- LLM SDK 직접 import 금지 — 도메인 코드는 `@nebula/ai` 경유
- `@forge/*` 참조 금지 — 모든 Forge 의존성은 Nebula 자체로 교체
- 커밋 메시지 한국어 본문, 영어 식별자

## 현재 상태
- `ai/` — Forge에서 이관한 AI 게이트웨이 패키지 (`@nebula/ai`)
- 아키텍처 미확정 — 별도 Plan 세션에서 설계 예정
