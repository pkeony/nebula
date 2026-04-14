/** MCP 도구 이름 → 한글 설명 매핑 */
const TOOL_LABELS: Record<string, string> = {
  read_file: '파일 읽기',
  list_directory: '디렉토리 탐색',
  grep_search: '텍스트 검색',
  write_file: '파일 쓰기',
  run_command: '명령어 실행',
  web_search: '웹 검색',
  search_repos: '레포 검색',
  get_file_contents: '파일 내용 조회',
  create_issue: '이슈 생성',
  list_issues: '이슈 목록',
  create_pull_request: 'PR 생성',
};

/**
 * "nebula__read_file" → "read_file (파일 읽기)"
 * 매핑이 없으면 영어 이름만 표시
 */
export function formatToolDisplay(qualifiedName: string): string {
  const raw = qualifiedName.replace(/__/g, '.').split('.').pop() ?? qualifiedName;
  const korean = TOOL_LABELS[raw];
  return korean ? `${raw} (${korean})` : raw.replace(/_/g, ' ');
}
