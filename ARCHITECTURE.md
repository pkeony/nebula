# Nebula — 아키텍처

> 설계 확정 전 초안. Plan 세션에서 구체화 예정.

## 패키지 구조 (예정)
```
nebula/
├── ai/                  ← @nebula/ai (이관 완료)
├── packages/            ← 공유 패키지
│   └── shared/          ← 공통 유틸, 타입
├── apps/                ← 서비스
│   ├── api/             ← 백엔드 API
│   └── web/             ← 프론트엔드 (React Flow 시각화)
└── docs/                ← 지식 맵
```

## 핵심 컴포넌트 (예정)
- **MCP Client** — 멀티 서버 연결, 프로토콜 직접 구현
- **Agent Loop** — LangChain 없이 직접 구현
- **실시간 시각화** — React Flow 기반 에이전트 실행 흐름

## 데이터 흐름
TBD — Plan 세션에서 설계
