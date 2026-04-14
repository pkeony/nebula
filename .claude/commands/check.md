전체 품질 체크를 순서대로 실행해줘:

1. pnpm tsc --noEmit (타입 체크)
2. pnpm lint (린트)
3. pnpm -r test (테스트)

에러가 있으면 각 단계에서 바로 수정하고 다음 단계로 진행.
$ARGUMENTS가 있으면 해당 패키지만 대상으로 실행.
