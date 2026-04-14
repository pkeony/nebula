import { resolve, normalize } from 'node:path';

/**
 * 파일 접근을 허용된 루트 디렉토리로 제한.
 * path traversal (../../etc/passwd) 공격을 방지.
 */

/** 접근 차단 경로 패턴 */
const BLOCKED_PATHS = [
  /\.env/,
  /\.git\//,
  /node_modules\//,
  /\/\.ssh\//,
  /\/\.aws\//,
];

/**
 * 경로가 allowedRoot 안에 있는지 검증.
 * @returns { safe: true } 또는 { safe: false, reason: string }
 */
export function validatePath(
  inputPath: string,
  allowedRoot: string,
): { safe: boolean; resolved: string; reason?: string } {
  const resolved = resolve(allowedRoot, inputPath);
  const normalizedRoot = normalize(allowedRoot);

  // path traversal 방지
  if (!resolved.startsWith(normalizedRoot)) {
    return {
      safe: false,
      resolved,
      reason: `경로가 허용된 범위를 벗어남: ${resolved} (허용: ${normalizedRoot})`,
    };
  }

  // 차단 패턴 체크
  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(resolved)) {
      return {
        safe: false,
        resolved,
        reason: `차단된 경로 패턴: ${pattern.source}`,
      };
    }
  }

  return { safe: true, resolved };
}

/** 테스트용 export */
export { BLOCKED_PATHS };
