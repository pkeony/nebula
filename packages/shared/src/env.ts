/**
 * 환경변수 파싱 — 필수 키가 없으면 즉시 throw.
 *
 * 각 패키지가 필요한 키만 꺼내 쓴다.
 * 새 키가 필요하면 Env 인터페이스에 추가.
 */

export interface Env {
  GOOGLE_API_KEY: string;
  VOYAGE_API_KEY: string;
}

let _cached: Env | null = null;

export function parseEnv(): Env {
  if (_cached) return _cached;

  const GOOGLE_API_KEY = process.env['GOOGLE_API_KEY'];
  const VOYAGE_API_KEY = process.env['VOYAGE_API_KEY'];

  if (!GOOGLE_API_KEY) throw new Error('[env] GOOGLE_API_KEY 가 설정되지 않았습니다');
  if (!VOYAGE_API_KEY) throw new Error('[env] VOYAGE_API_KEY 가 설정되지 않았습니다');

  _cached = { GOOGLE_API_KEY, VOYAGE_API_KEY };
  return _cached;
}
