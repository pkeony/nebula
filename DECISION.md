# Nebula — 기술 결정 기록

> 왜 이 기술을 선택했는지, 무엇을 고민했는지, 무엇을 시도했다 포기했는지.

---

## D1. Agent Loop 직접 구현 (LangChain/LangGraph 미사용)

**결정:** think→act→observe 사이클을 프레임워크 없이 직접 구현

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| LangChain/LangGraph | 빠른 프로토타이핑, 커뮤니티 | 블랙박스, 과도한 추상화, 디버깅 어려움 |
| Vercel AI SDK | 스트리밍 지원, Next.js 통합 | Agent loop 커스텀 제한적 |
| **직접 구현** | 완전한 제어, 원리 이해 | 개발 시간, 엣지 케이스 직접 처리 |

**근거:**
- Forge 프로젝트에서 RAG 직접 구현 → 동작 원리 체득한 경험이 면접에서 강력한 차별화
- Agent 내부 동작(토큰 최적화, 도구 선택 전략, 반복 제어)을 직접 제어해야 프로덕션 레벨 가능
- "프레임워크 쓸 줄 안다"보다 "프레임워크가 왜 그렇게 만들어졌는지 안다"가 더 가치

---

## D2. MCP 프로토콜 양쪽 구현 (서버 + 클라이언트)

**결정:** MCP 서버와 클라이언트를 모두 직접 구현

**근거:**
- 서버만 만들면 "API 감싸기" 수준 — 클라이언트까지 해야 프로토콜 완전 이해
- 멀티 서버 통합 라우팅은 실전에서 핵심 과제 (Claude Code도 이 패턴)
- `@modelcontextprotocol/sdk` 사용 — JSON-RPC 직접 구현은 시간 대비 학습 가치 낮음

---

## D3. MCP Transport: stdio 선택

**결정:** stdio 기반 로컬 프로세스 통신

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| **stdio** | 단순, 안정, 디버깅 쉬움 | 로컬 전용 |
| Streamable HTTP | 리모트 가능 | 복잡도 증가, 인증 필요 |

**근거:**
- 초기에는 로컬 개발 환경에서 검증이 우선
- stdio → HTTP 전환은 transport 계층만 교체하면 되므로 나중에 확장 가능
- Claude Code도 로컬 MCP 서버는 stdio 사용

---

## D4. SSE 스트리밍 (WebSocket 대신)

**결정:** Agent 실행 결과를 SSE(Server-Sent Events)로 스트리밍

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| **SSE** | 단방향, HTTP 기반, 프록시 친화 | 양방향 불가 |
| WebSocket | 양방향 | 과잉, 프록시 이슈, 재연결 복잡 |
| Long Polling | 단순 | 비효율적, 지연 |

**근거:**
- Agent 실행은 서버→클라이언트 단방향 스트림
- 사용자 입력은 초기 POST 요청 한 번 — 양방향 불필요
- AsyncIterable 패턴과 자연스럽게 연결 (`@nebula/ai`의 stream() 함수)
- Cloud Run 등 서버리스 환경에서 SSE가 WebSocket보다 호환성 좋음

---

## D5. Gemini 모델 선택

**결정:** Gemini 2.5-flash를 기본 모델로 사용

**근거:**
- 비용 효율: $0.15/1M input, $0.60/1M output
- 1M 토큰 컨텍스트 — Agent loop에서 긴 대화 이력 유지
- Tool use 지원 (function calling)
- Forge에서 이미 검증된 통합 코드 재활용

**향후:** Gemini 3-flash-preview 전환 시 pricing 모듈만 업데이트

---

## D6. 모노레포 패키지 경계 설계

**결정:** 도메인별 5개 패키지 + 2개 앱

```
ai (LLM) ← shared (env)
mcp-server ← (독립)
mcp-client ← @modelcontextprotocol/sdk
agent ← ai + mcp-client + shared
api ← agent
web ← (독립, API 호출)
```

**근거:**
- 각 패키지가 독립 빌드·테스트 가능 → CI에서 변경된 패키지만 테스트
- `@nebula/ai`를 격리해서 LLM 모델 교체 시 한 곳만 수정
- MCP 서버/클라이언트 분리 → 서버는 별도 프로세스로 실행되므로 물리적으로도 분리

---

## D7. 지식 맵 구조 (CLAUDE.md 체계)

**결정:** CLAUDE.md를 "안내판"으로, 상세는 하위 문서로 분리

**근거:**
- AI 컨텍스트 윈도우는 한정된 자원 — 모든 문서를 한 번에 로드하면 낭비
- CLAUDE.md는 매 세션 자동 로드 → 여기서 필요한 하위 문서만 참조
- docs/ 하위 구조: design-docs (ADR), product-specs (명세), exec-plans (실행계획), references (참고자료)

---

## D8. Zod 스키마 시스템

**결정:** MCP 도구 입력 검증에 Zod 사용

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| **Zod** | MCP SDK 네이티브 통합, TS 타입 추론 | 번들 크기 |
| JSON Schema 직접 | 표준, 가벼움 | TS 타입과 동기화 수동 |
| io-ts | FP 스타일, 정확 | 학습 곡선, 커뮤니티 작음 |

**근거:**
- `@modelcontextprotocol/sdk`가 Zod를 퍼스트 클래스로 지원
- `.describe()`로 도구 설명까지 스키마에 포함 → LLM이 도구 사용법 이해
- 런타임 검증 + 컴파일 타임 타입 — 이중 안전망

---

## D9. Agent Loop — 비스트리밍 chat() 사용

**결정:** Agent의 각 LLM 호출을 `stream()` 대신 `chat()`으로 수행

**근거:**
- 도구 호출 감지가 단순 — `chat()` 응답에서 `functionCalls` 필드를 바로 확인
- `stream()`은 청크 단위로 텍스트를 흘리는데, functionCall 응답은 스트리밍 중간에 감지해야 함 → 복잡도 증가
- 최종 텍스트 응답만 delta로 클라이언트에 전달하면 UX 충분
- 향후 thinking 과정도 실시간 표시하려면 stream()으로 전환 가능 — executor 내부만 변경

---

## D10. MCP 서버 설정 — 서버 사이드 전용

**결정:** 클라이언트 요청에서 `mcpServers` 필드를 제거, 서버 사이드에서만 설정

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| 클라이언트 제공 | 유연, 동적 서버 추가 | **RCE 취약점** — 임의 command spawn |
| 허용 목록 | 유연 + 보안 | 관리 복잡, 목록 유지보수 |
| **서버 사이드 전용** | RCE 원천 차단 | 서버 재시작 필요 |

**근거:**
- 코드 리뷰에서 발견: 클라이언트가 `{ command: "rm", args: ["-rf", "/"] }` 전송 가능
- 포트폴리오에서 "보안 취약점을 사전 차단했다"는 면접 어필 포인트
- 서버 설정은 환경변수나 설정 파일에서 로드하는 것이 프로덕션 패턴

---

## D11. SSE — Fastify reply.raw 직접 사용

**결정:** SSE 플러그인 없이 `reply.raw` (Node.js ServerResponse) 직접 사용

**근거:**
- Fastify에는 공식 SSE 플러그인이 없음
- 서드파티 플러그인 의존보다 30줄 직접 구현이 더 명확
- `reply.raw.writeHead()` + `reply.raw.write()` + `reply.raw.end()` 세 단계면 충분
- `X-Accel-Buffering: no` 헤더로 nginx 프록시 환경도 지원

---

## D12. 멀티턴 대화 저장소 — In-memory Map

**결정:** 서버 사이드 `Map<conversationId, Conversation>`으로 대화 이력 관리

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| **In-memory Map** | 즉시 구현, 외부 의존 없음 | 서버 재시작 시 유실, 수평 확장 불가 |
| SQLite/PostgreSQL | 영속성, 쿼리 가능 | 설정 복잡, MVP에 과잉 |
| Redis | 빠름, TTL 네이티브, 수평 확장 | 외부 의존성 추가 |

**근거:**
- MVP 단계에서 외부 DB 없이 빠르게 검증
- TTL 1시간 + 5분 간격 정리로 메모리 누수 방지 (cleanupTimer.unref())
- 인터페이스가 Map이므로 나중에 Redis/DB 교체 시 래퍼만 변경
- 면접에서 "의도적 단순화 → 점진적 확장" 전략 설명 가능

---

## D13. 스트리밍 전략 — streamChat() 함수

**결정:** `chat()` (비스트리밍) → `streamChat()` (스트리밍 + functionCall 감지) 전환

**선택지:**
| 옵션 | 장점 | 단점 |
|------|------|------|
| chat() 유지 + 텍스트 분할 | 단순, 기존 코드 최소 변경 | 가짜 스트리밍, UX 열등 |
| **streamChat()** | 진짜 글자 단위 스트리밍, 도구 호출도 감지 | generateContentStream 이해 필요 |
| chat() + stream() 2-pass | 진짜 스트리밍 | 토큰 낭비 (같은 요청 두 번) |

**근거:**
- Gemini `generateContentStream`이 functionCall도 지원 — 스트림 종료 후 final response에서 추출
- 텍스트 delta는 스트리밍 중 실시간 yield, functionCall은 완료 후 일괄 처리
- thinking 텍스트도 실시간으로 보여줄 수 있는 확장성
- D9(비스트리밍 chat() 사용)의 합리적 진화 — "이유가 생기면 전환한다"는 원칙 실행

---

## D14. 에러 코드 체계 — ErrorCode 타입

**결정:** `ErrorCode` 유니온 타입으로 에러 분류, `retryable` 플래그로 재시도 가능 여부 표시

**근거:**
- 429/503을 구분해야 사용자에게 적절한 가이드 제공 (잠시 대기 vs 재시도 불가)
- SSE 연결 전 HTTP 에러와 스트리밍 중 에러를 통합된 체계로 처리
- 프론트엔드에서 에러 코드별 한국어 메시지 매핑 — UX 품질 향상
- retryable 플래그로 "다시 시도" 버튼 조건부 표시

---

## 시도했지만 안 된 것

| 시도 | 결과 | 교훈 |
|------|------|------|
| (아직 없음 — 진행하며 추가) | | |
