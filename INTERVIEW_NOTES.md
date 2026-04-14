# Nebula — 면접 대비 기술 노트

> code-reviewer가 잡아낸 실전 이슈 + 면접 빈출 패턴을 연결.
> "이론을 아는 것"이 아니라 "실제 프로젝트에서 겪고 수정한 경험"으로 대답할 수 있게.

---

## 1. React `key` 안티패턴 — `key={i}` 문제

### 면접 질문
> "React에서 리스트 렌더링 시 key를 index로 쓰면 안 되는 이유는?"

### Nebula에서 실제로 겪은 것
`MessageList.tsx`와 `ProcessTimeline.tsx` 모두에서 `key={i}`를 사용했다가 code-reviewer에게 지적받음.

```tsx
// Bad — 메시지가 중간에 삽입/삭제되면 React가 잘못된 컴포넌트 재사용
{messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

// Good — stable identifier 사용
{messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
```

### 왜 문제인가
- index key는 "순서"를 식별자로 쓰는 것 — 항목이 추가/삭제/재정렬되면 React가 **다른 항목의 DOM을 재사용**
- 입력 필드가 있는 리스트에서 특히 치명적 (A의 입력값이 B에 보이는 버그)
- 성능 이슈: 불필요한 리렌더링 발생

### 면접 대답 예시
> "Nebula에서 채팅 메시지 리스트를 index key로 렌더링했다가, 스트리밍 중 메시지가 추가될 때 이전 메시지의 DOM이 재사용되는 문제를 발견했습니다. stable ID로 교체해서 해결했고, 이후 ProcessTimeline의 타임라인 스텝에도 같은 패턴을 적용했습니다."

---

## 2. `useEffect` 의존성 배열 — 참조 vs 값

### 면접 질문
> "useEffect 의존성 배열에 배열이나 객체를 넣으면 어떻게 되나요?"

### Nebula에서 실제로 겪은 것
`MessageList.tsx`에서 `[messages]`를 의존성으로 넣었더니, 스트리밍 delta가 올 때마다 매번 스크롤 이벤트가 발생.

```tsx
// Bad — messages는 매번 새 배열 참조 → delta 토큰마다 effect 재실행
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// Good — 실제로 관심 있는 "변화"만 추적
}, [messages.length]);
```

### 핵심 개념
- JavaScript에서 `[] !== []` — 배열/객체는 **참조 비교**
- `useAgentStream`이 새 배열을 반환할 때마다 effect가 불필요하게 재실행
- 해결: primitive 값(`length`)으로 변환하거나, `useMemo`로 참조 안정화

### 면접 대답 예시
> "스트리밍 채팅에서 스크롤이 튀는 버그가 있었는데, useEffect 의존성에 messages 배열 자체를 넣어서 매 delta 토큰마다 smooth scroll이 트리거되는 게 원인이었습니다. `messages.length`로 변경해서 실제 메시지 추가 시에만 스크롤되도록 수정했습니다."

---

## 3. `useMemo` — 렌더링 성능 최적화

### 면접 질문
> "useMemo는 언제 쓰고, 언제 안 쓰나요?"

### Nebula에서 실제로 겪은 것
`ProcessTimeline.tsx`에서 `buildSteps(events)` 함수가 매 렌더마다 전체 이벤트 배열을 순회. 스트리밍 중에는 렌더가 수십 번 발생하므로 불필요한 연산이 반복됨.

```tsx
// Bad — 매 렌더마다 O(n) 순회
const steps = buildSteps(events);

// Good — events 참조가 변경될 때만 재계산
const steps = useMemo(() => buildSteps(events), [events]);
```

### 언제 쓸까 / 안 쓸까
- **쓸 때**: 비용이 큰 연산(배열 순회, 정렬, 그룹화), 참조 안정성이 필요한 경우(자식에 props로 전달)
- **안 쓸 때**: 단순 값 계산, primitive 반환, 렌더 자체가 드문 컴포넌트

### 면접 대답 예시
> "Process Flow 타임라인에서 이벤트를 그룹화하는 `buildSteps()` 함수가 매 렌더마다 전체 배열을 순회했는데, 스트리밍 중에는 초당 수십 번 렌더가 발생해서 불필요한 연산이 반복됐습니다. `useMemo`로 감싸서 events 참조가 실제로 변경될 때만 재계산하도록 최적화했습니다."

---

## 4. 접근성(a11y) — 클릭 가능한 요소의 키보드 접근

### 면접 질문
> "웹 접근성에서 가장 흔한 실수는 뭔가요?"

### Nebula에서 실제로 겪은 것
`Sidebar.tsx`에서 세션 목록 항목을 `<div onClick={...}>`으로 구현. 마우스로는 작동하지만 Tab 키로 포커스 불가, Enter/Space로 활성화 불가.

```tsx
// Bad — 키보드 사용자/스크린리더 접근 불가
<div onClick={() => onSwitch(session.id)} className="cursor-pointer">

// Good — 시맨틱 HTML 사용
<button onClick={() => onSwitch(session.id)} className="w-full text-left">
```

### 핵심 개념
- `<div>`, `<span>` 등 non-interactive 요소에 `onClick`만 달면 **키보드 접근 불가**
- `<button>` 또는 `<a>`를 사용하면 자동으로 포커스, Enter/Space 활성화, 스크린리더 지원
- `role="button" tabIndex={0} onKeyDown` 조합으로도 가능하지만, 네이티브 요소가 항상 우선

### 면접 대답 예시
> "사이드바에서 `div`에 onClick만 달아서 키보드 접근이 안 되는 걸 code-reviewer가 잡아냈습니다. `button`으로 교체해서 Tab 포커스와 Enter 활성화를 자동 지원하게 수정했습니다. a11y는 단순히 스크린리더만의 문제가 아니라 키보드 파워유저 경험에도 직결됩니다."

---

## 5. XSS 방어 — 마크다운 렌더링 보안

### 면접 질문
> "사용자 입력을 마크다운으로 렌더링할 때 보안 고려사항은?"

### Nebula에서 실제로 겪은 것
`react-markdown`으로 AI 응답을 렌더링할 때, 기본적으로 raw HTML은 차단되지만 플러그인 추가 시 XSS가 열릴 수 있음. 특히 Nebula는 MCP 서버 경유 외부 데이터가 응답에 포함될 수 있는 구조.

```tsx
// 기본 — react-markdown은 raw HTML 차단하지만 방어적 설계
import rehypeSanitize from 'rehype-sanitize';
<Markdown rehypePlugins={[rehypeSanitize]}>{message.content}</Markdown>
```

### 핵심 개념
- `react-markdown`은 기본적으로 `<script>` 등을 렌더링하지 않음
- 그러나 `rehype-raw` 플러그인 추가 시 HTML 주입 가능 → `rehype-sanitize` 필수
- Agent가 외부 MCP 서버(웹 검색, 파일 읽기)에서 가져온 데이터를 응답에 포함할 수 있음
- **방어적 설계**: 지금은 안전해도, 향후 플러그인 추가 시 자동 보호

### 면접 대답 예시
> "AI 응답을 마크다운으로 렌더링할 때, react-markdown 자체는 raw HTML을 차단하지만 향후 rehype-raw 같은 플러그인 추가 시 XSS가 열릴 수 있어서 rehype-sanitize를 기본으로 달아뒀습니다. 특히 Agent가 MCP 서버를 통해 외부 데이터를 가져오는 구조라 신뢰할 수 없는 컨텐츠가 응답에 섞일 수 있어서 방어적 설계가 중요했습니다."

---

## 6. 시맨틱 HTML — `<header>` 중첩 문제

### 면접 질문
> "시맨틱 HTML이 왜 중요한가요?"

### Nebula에서 실제로 겪은 것
`page.tsx`에 `<header>`(탑바)가 있고, `ChatPanel.tsx` 안에도 `<header>`(Active Session)가 있어서 `<header>` 태그가 중첩됨. 스크린리더가 "페이지 헤더"를 두 번 인식.

```tsx
// Bad — header 중첩 → 스크린리더 혼동
<header> // page.tsx 탑바
  <header> // ChatPanel 내부
  </header>
</header>

// Good — ChatPanel 내부는 div로 변경
<header> // page.tsx 탑바
  <div> // ChatPanel 내부 — 시맨틱 role 없음
  </div>
</header>
```

### 면접 대답 예시
> "채팅 패널과 메인 페이지에 `<header>` 태그가 중첩되어 스크린리더가 혼동하는 문제를 발견했습니다. 내부 패널의 header를 `<div>`로 변경해서 시맨틱 구조를 정리했습니다."

---

## 7. CSS 변수와 Tailwind opacity modifier

### 면접 질문
> "Tailwind의 opacity modifier(`bg-red-500/50`)가 CSS 변수에서 안 되는 이유는?"

### Nebula에서 실제로 겪은 것
`ChatPanel.tsx`에서 `bg-[var(--color-error-container)]/8` 사용. hex 값(`#fa746f`)에는 Tailwind의 `/8` opacity modifier가 적용되지 않음.

```css
/* Tailwind opacity modifier가 작동하려면 RGB 채널 형식 필요 */
--color-error-container: #fa746f;       /* ❌ /8 안 됨 */
--color-error-container: 250 116 111;   /* ✅ /8 작동 */

/* 또는 컴포넌트에서 직접 */
className="bg-[rgba(250,116,111,0.08)]" /* ✅ 확실한 방법 */
```

### 핵심 개념
- Tailwind의 `/<opacity>` 문법은 내부적으로 `rgb(R G B / <opacity>)` 형식으로 변환
- CSS 변수가 hex(`#fa746f`)면 Tailwind가 채널을 분리할 수 없어서 opacity 무시
- 해결: CSS 변수를 `R G B` 형식으로 정의하거나, `rgba()` 직접 사용

---

## 8. Flex 레이아웃 — `min-height: auto` 함정

### 면접 질문
> "flex 컨테이너에서 자식 요소가 넘치는데 스크롤이 안 되는 이유는?"

### Nebula에서 실제로 겪은 것
오른쪽 Process Flow 패널이 길어지면 전체 페이지가 늘어나서 채팅 입력창이 화면 밖으로 밀려남. 3번 수정 시도 끝에 근본 원인 발견.

```tsx
// Bad — min-h-screen은 "최소" 높이 → 콘텐츠가 길면 늘어남
<div className="flex min-h-screen">

// Good — h-screen + overflow-hidden으로 뷰포트에 고정
<div className="flex h-screen overflow-hidden">
```

### 핵심 개념
- flex 자식의 기본 `min-height`는 `auto` — 콘텐츠 크기만큼 최소 크기 보장
- `min-h-0`을 추가해야 flex-1이 콘텐츠보다 작아질 수 있음
- `min-h-screen`은 "뷰포트 이상"이라서 내부 콘텐츠가 길면 전체가 늘어남
- 양쪽 패널 독립 스크롤: 부모는 `h-screen overflow-hidden`, 각 패널은 `overflow-y-auto`

### 면접 대답 예시
> "2-패널 레이아웃에서 오른쪽 타임라인이 길어지면 왼쪽 채팅 입력창까지 밀려나는 버그가 있었습니다. `min-h-screen`이 뷰포트 '최소' 높이라서 콘텐츠에 의해 늘어나는 게 원인이었고, `h-screen overflow-hidden`으로 고정한 뒤 각 패널에 독립 `overflow-y-auto`를 적용해서 해결했습니다. flex의 `min-height: auto` 기본값 때문에 발생하는 흔한 함정입니다."

---

## 활용 방법

이 문서의 각 항목은 이 구조로 되어 있다:
1. **면접 질문** — 실제로 나올 법한 질문
2. **Nebula 실전 경험** — 프로젝트에서 겪은 구체적 상황
3. **핵심 개념** — 기술적 원리
4. **면접 대답 예시** — 실전 경험 기반 대답 템플릿

면접에서 "이론적으로 ~입니다"보다 **"제 프로젝트에서 ~를 겪었고, ~로 해결했습니다"**가 훨씬 강하다.
