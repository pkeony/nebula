import { describe, it, expect } from 'vitest';
import { validatePath } from './path-guard.js';

const ROOT = '/home/user/project';

describe('validatePath', () => {
  it('허용된 범위 내 경로는 통과', () => {
    const result = validatePath('src/index.ts', ROOT);
    expect(result.safe).toBe(true);
    expect(result.resolved).toBe('/home/user/project/src/index.ts');
  });

  it('절대 경로도 루트 안이면 통과', () => {
    const result = validatePath('/home/user/project/README.md', ROOT);
    expect(result.safe).toBe(true);
  });

  it('path traversal (../../etc/passwd) 차단', () => {
    const result = validatePath('../../etc/passwd', ROOT);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('벗어남');
  });

  it('루트 밖 절대 경로 차단', () => {
    const result = validatePath('/etc/passwd', ROOT);
    expect(result.safe).toBe(false);
  });

  it('.env 파일 차단', () => {
    const result = validatePath('.env', ROOT);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('.env');
  });

  it('.env.local 파일도 차단', () => {
    const result = validatePath('.env.local', ROOT);
    expect(result.safe).toBe(false);
  });

  it('.git/ 디렉토리 차단', () => {
    const result = validatePath('.git/config', ROOT);
    expect(result.safe).toBe(false);
  });

  it('node_modules/ 차단', () => {
    const result = validatePath('node_modules/zod/package.json', ROOT);
    expect(result.safe).toBe(false);
  });

  it('.ssh 디렉토리 차단', () => {
    const result = validatePath('/home/user/.ssh/id_rsa', '/home/user');
    expect(result.safe).toBe(false);
  });
});
