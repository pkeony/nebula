'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/* ── Nebula Landing Page ── */

const FEATURES = [
  {
    tag: '에이전트 루프',
    title: '판단 → 실행 → 관찰',
    description:
      'LangChain 없이 Agent Loop를 직접 구현했습니다. LLM이 스스로 판단하고, 도구를 선택하고, 결과를 관찰하는 자율 실행 사이클.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-4.2-5.8l2.1-2.1M7.1 16.9l-2.1 2.1m12 0l-2.1-2.1M7.1 7.1L5 5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    span: 'md:col-span-2',
  },
  {
    tag: 'MCP 프로토콜',
    title: '서버와 클라이언트, 양쪽 모두',
    description:
      'Model Context Protocol의 서버(6개 도구)와 클라이언트(멀티 서버 레지스트리)를 직접 구현. 프로토콜 양쪽을 이해하는 깊은 설계.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="2" y="3" width="8" height="6" rx="1.5" />
        <rect x="14" y="3" width="8" height="6" rx="1.5" />
        <rect x="8" y="15" width="8" height="6" rx="1.5" />
        <path d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9" strokeLinecap="round" />
        <path d="M12 15v-3" strokeLinecap="round" />
      </svg>
    ),
    span: 'md:col-span-1',
  },
  {
    tag: '실시간 시각화',
    title: '실행 과정을 눈으로 보다',
    description:
      'SSE 스트리밍과 React Flow로 Agent의 사고 과정을 실시간 시각화. 블랙박스가 아닌 투명한 AI.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    span: 'md:col-span-1',
  },
  {
    tag: '스트리밍',
    title: '실시간 단방향 스트림',
    description:
      'WebSocket 대신 SSE를 선택하고, AsyncIterable 패턴으로 자연스러운 스트림 처리를 구현했습니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M4 4v16h16" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16l4-4 4 2 4-6 4-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    span: 'md:col-span-2',
  },
];

const TECH_STACK = [
  { name: 'TypeScript', category: '언어' },
  { name: 'Node.js 22+', category: '런타임' },
  { name: 'Next.js 15', category: '프론트엔드' },
  { name: 'React 19', category: 'UI' },
  { name: 'React Flow', category: '시각화' },
  { name: 'Fastify', category: 'API' },
  { name: 'Gemini', category: 'LLM' },
  { name: 'MCP SDK', category: '프로토콜' },
  { name: 'Zod', category: '검증' },
  { name: 'pnpm', category: '워크스페이스' },
  { name: 'SSE', category: '스트리밍' },
  { name: 'Voyage', category: '임베딩' },
];

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div
      className="min-h-[100dvh] text-[#e8e6e1]"
      style={{
        fontFamily: "'Pretendard', 'Outfit', system-ui, sans-serif",
        background: '#0a0a0a',
      }}
    >
      {/* ── Grain Overlay ── */}
      <div
        className="fixed inset-0 z-[60] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Ambient Gradient ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(70,101,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(70,101,94,0.06) 0%, transparent 50%)',
        }}
      />

      {/* ── Navigation ── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div
          className="flex items-center gap-8 px-8 py-3 rounded-full"
          style={{
            background: 'rgba(10,10,10,0.7)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif", color: '#46655e' }}
          >
            Nebula
          </span>
          <div className="hidden sm:flex items-center gap-6 text-base text-[#888]">
            <a href="#features" className="hover:text-[#e8e6e1] transition-colors">주요 기능</a>
            <a href="#architecture" className="hover:text-[#e8e6e1] transition-colors">아키텍처</a>
            <a href="#stack" className="hover:text-[#e8e6e1] transition-colors">기술 스택</a>
          </div>
          <Link
            href="/chat"
            className="ml-2 px-6 py-2.5 text-base font-medium rounded-full transition-all duration-300"
            style={{
              background: '#46655e',
              color: '#e3fff7',
            }}
          >
            체험하기
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-[100dvh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center">
            {/* Left — Text */}
            <div className="lg:col-span-3 space-y-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide"
                style={{
                  background: 'rgba(70,101,94,0.15)',
                  color: '#7ab0a3',
                  border: '1px solid rgba(70,101,94,0.2)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#46655e', animation: 'pulse-dot 2s ease-in-out infinite' }}
                />
                AI 에이전트 플랫폼
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-tight"
                style={{ wordBreak: 'keep-all' }}
              >
                <span className="block text-[#e8e6e1]">나만의</span>
                <span className="block" style={{ color: '#46655e' }}>
                  Claude Code를
                </span>
                <span className="block text-[#e8e6e1]">만든다</span>
              </h1>

              <p
                className="text-lg sm:text-xl leading-relaxed max-w-[52ch]"
                style={{ color: '#888', wordBreak: 'keep-all' }}
              >
                LLM이 도구를 자율적으로 선택하고 실행하는 에이전트 플랫폼.
                프레임워크 없이 Agent Loop를 직접 구현하고, MCP 프로토콜의
                양쪽을 모두 설계했습니다.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/chat"
                  className="group inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold rounded-2xl transition-all duration-400"
                  style={{
                    background: '#46655e',
                    color: '#e3fff7',
                    boxShadow: '0 0 0 1px rgba(70,101,94,0.3), 0 8px 24px rgba(70,101,94,0.2)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 1px rgba(70,101,94,0.5), 0 12px 32px rgba(70,101,94,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 1px rgba(70,101,94,0.3), 0 8px 24px rgba(70,101,94,0.2)';
                  }}
                >
                  에이전트 체험하기
                  <svg
                    className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-5 text-base font-medium rounded-2xl transition-all duration-300 hover:bg-white/5"
                  style={{
                    color: '#888',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>

            {/* Right — Agent Flow Visual */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="relative">
                <div
                  className="relative rounded-3xl p-8 space-y-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {[
                    { step: '판단', desc: 'LLM이 상황을 분석하고 다음 행동을 결정' },
                    { step: '실행', desc: 'MCP 도구를 선택하고 실행' },
                    { step: '관찰', desc: '결과를 관찰하고 다음 사이클로' },
                  ].map((item, i) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-4 px-5 py-5 rounded-xl"
                      style={{
                        background:
                          i === 0
                            ? 'rgba(70,101,94,0.12)'
                            : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${i === 0 ? 'rgba(70,101,94,0.25)' : 'rgba(255,255,255,0.04)'}`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{
                          background:
                            i === 0 ? 'rgba(70,101,94,0.3)' : 'rgba(255,255,255,0.08)',
                          color: i === 0 ? '#7ab0a3' : '#b0ada8',
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div
                          className="text-base font-bold tracking-wide"
                          style={{
                            color: i === 0 ? '#7ab0a3' : '#c8c5c0',
                          }}
                        >
                          {item.step}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: '#999' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loop arrow */}
                  <div className="flex justify-center pt-2">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#46655e" strokeWidth="1.5">
                      <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 주요 기능 — Bento Grid ── */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="reveal-element mb-16">
            <p
              className="text-base font-medium tracking-widest mb-4"
              style={{ color: '#46655e' }}
            >
              주요 기능
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
              style={{ wordBreak: 'keep-all' }}
            >
              프레임워크 뒤에 숨지 않는
              <br />
              <span style={{ color: '#555' }}>직접 구현의 깊이</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.tag}
                data-reveal
                className={`reveal-element ${f.span} group relative rounded-2xl p-8 transition-all duration-500 hover:-translate-y-1`}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(70,101,94,0.12)',
                      color: '#7ab0a3',
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-sm font-semibold tracking-wider"
                    style={{ color: '#46655e' }}
                  >
                    {f.tag}
                  </span>
                </div>

                <h3
                  className="text-xl font-bold mb-3 tracking-tight"
                  style={{ color: '#e8e6e1' }}
                >
                  {f.title}
                </h3>

                <p
                  className="text-base leading-relaxed"
                  style={{ color: '#777', wordBreak: 'keep-all' }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 아키텍처 ── */}
      <section id="architecture" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="reveal-element mb-16">
            <p
              className="text-base font-medium tracking-widest mb-4"
              style={{ color: '#46655e' }}
            >
              아키텍처
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
              style={{ wordBreak: 'keep-all' }}
            >
              모노레포 위에 세운
              <br />
              <span style={{ color: '#555' }}>명확한 패키지 경계</span>
            </h2>
            <p className="text-lg leading-relaxed mt-6 max-w-[60ch]" style={{ color: '#777', wordBreak: 'keep-all' }}>
              각 패키지가 독립적으로 빌드·테스트 가능하도록 설계했습니다.
              LLM 호출은 반드시 @nebula/ai를 경유하고,
              Agent와 MCP는 프로토콜 계층으로 분리했습니다.
            </p>
          </div>

          {/* Diagram */}
          <div data-reveal className="reveal-element max-w-4xl">
            <div
              className="rounded-2xl p-8 font-mono text-base leading-relaxed overflow-x-auto"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                <span className="ml-3 text-sm" style={{ color: '#555' }}>시스템 구조</span>
              </div>
              <pre style={{ color: '#666' }}>
                <code>{`브라우저 ──POST /agent/run──> API (Fastify)
   ◄──── SSE 스트림 ──────────  │
                                │
                         AgentExecutor
                          │
                          ├── `}<span style={{ color: '#7ab0a3' }}>판단</span>{`
                          │    └── @nebula/ai (Gemini)
                          │
                          ├── `}<span style={{ color: '#7ab0a3' }}>실행</span>{`
                          │    └── McpRegistry
                          │         ├── 자체 MCP 서버
                          │         └── 외부 MCP 서버
                          │
                          └── `}<span style={{ color: '#7ab0a3' }}>관찰</span>{`
                               └── 다음 사이클로 ↩`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── 기술 스택 ── */}
      <section id="stack" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="reveal-element text-center mb-16">
            <p
              className="text-base font-medium tracking-widest mb-4"
              style={{ color: '#46655e' }}
            >
              기술 스택
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{ wordBreak: 'keep-all' }}
            >
              검증된 도구, 의도된 선택
            </h2>
          </div>

          <div data-reveal className="reveal-element flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {TECH_STACK.map((tech, i) => (
              <div
                key={tech.name}
                className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span className="text-base font-medium" style={{ color: '#e8e6e1' }}>
                  {tech.name}
                </span>
                <span className="ml-2 text-sm" style={{ color: '#555' }}>
                  {tech.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            data-reveal
            className="reveal-element relative rounded-3xl px-8 py-24 sm:px-16 text-center overflow-hidden"
            style={{
              background: 'rgba(70,101,94,0.08)',
              border: '1px solid rgba(70,101,94,0.15)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(70,101,94,0.15) 0%, transparent 70%)',
              }}
            />

            <h2
              className="relative text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8"
              style={{ wordBreak: 'keep-all' }}
            >
              에이전트가 어떻게 생각하는지
              <br />
              <span style={{ color: '#46655e' }}>직접 확인해보세요</span>
            </h2>

            <p
              className="relative text-lg mb-12 max-w-[45ch] mx-auto"
              style={{ color: '#777', wordBreak: 'keep-all' }}
            >
              질문을 던지면 에이전트가 도구를 선택하고, 실행하고,
              결과를 바탕으로 다음 행동을 결정하는 전 과정을
              실시간으로 볼 수 있습니다.
            </p>

            <Link
              href="/chat"
              className="relative inline-flex items-center gap-3 px-12 py-6 text-xl font-semibold rounded-2xl transition-all duration-400"
              style={{
                background: '#46655e',
                color: '#e3fff7',
                boxShadow: '0 0 0 1px rgba(70,101,94,0.3), 0 12px 40px rgba(70,101,94,0.25)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 1px rgba(70,101,94,0.5), 0 16px 48px rgba(70,101,94,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 1px rgba(70,101,94,0.3), 0 12px 40px rgba(70,101,94,0.25)';
              }}
            >
              지금 체험하기
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 py-12"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "'Outfit', sans-serif", color: '#46655e' }}
              >
                Nebula
              </span>
              <span className="text-sm" style={{ color: '#444' }}>
                AI 에이전트 플랫폼
              </span>
            </div>

            <div className="flex items-center gap-6 text-base" style={{ color: '#555' }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e8e6e1] transition-colors">
                GitHub
              </a>
              <span style={{ color: '#333' }}>·</span>
              <span>Kelvin Park</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Animations ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(1.5rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .reveal-element {
          opacity: 0;
          transform: translateY(1.5rem);
        }

        .reveal-element.animate-in {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
