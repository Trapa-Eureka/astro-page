# WORKFLOW — 이 레포를 굴리는 AI-native 규칙

기반: Clare Liguori (AWS), "From AI-Assisted to AI-Native: Building a Frontier Development Team"
(https://youtu.be/Ry0WHNxDbYA · AWS 블로그: https://aws.amazon.com/blogs/machine-learning/how-frontier-teams-are-reinventing-ai-native-development/)
운영 원칙은 앞선 다섯 레포와 동일. 공통 요약 + **이 레포 특이사항**만 적는다.

## 0. 역할 정의 (프론티어 3행동)

| 행동 | 이 레포에서 |
|---|---|
| Hands-off Coding (1~2%) | Jin은 SPEC/DESIGN 수정·시각 리뷰·Keystatic 스모크·평가 판단만 |
| Infrequent Interaction | 태스크마다 기계 판정 완료 기준(check + verify) → 세션 중 개입 없이 완주 |
| Minimized Idle Time | T2 후 레인 A~D 병렬. 여섯 레포 백로그를 하나의 worktree 큐로 운용 |

## 1. 습관 5개 → 규칙 (공통 요약)

1. **Agent Context** — 부족지식은 CLAUDE.md/docs에만. 격주 프루닝 + 로그.
2. **Slow Down to Speed Up** — 콘텐츠 정책(정렬·draft 제외)을 `publishedPosts` 한 함수로 몰고, 스키마를 이중이 아닌 "패리티 테스트로 묶인 단일 진실"로 만드는 것이 이 레포의 선투자.
3. **Feed, Don't Babysit** — 배정은 TASKS 템플릿 1회, 자기 검증 = `npm run check`(+T7 이후 verify).
   ```bash
   git worktree add ../astro-test-t4 -b t4 && cd ../astro-test-t4 && claude
   ```
4. **Explicit Intent** — 콘텐츠 모델·라우트·verify 규칙 변경은 DESIGN/TESTING diff가 코드보다 먼저.
5. **Shift Left** — 정적 사이트의 번역: **빌드 산출물(dist) 검사가 곧 로컬 결정론 목**이다. 브라우저·라이브 배포 없이 링크·메타·정책을 전부 기계 판정하고, 시각 품질만 사람 리뷰로 남긴다.

## 2. astro-test 특이사항

- **레퍼런스 저작권 규율**: Guardian의 텍스트·서체·로고가 코드·콘텐츠·에셋에 유입되면 즉시 반려. verify의 금지 문자열 스캔은 안전망일 뿐, 리뷰가 1차 방어선이다. 차용은 SPEC §2 "레이아웃 문법" 목록까지만 — 애매하면 차용하지 않는 쪽으로.
- **콘텐츠도 산출물**: 시드 포스트는 픽션이되 엣지 케이스(draft·다저자·커버 유무)를 내장한 픽스처로 취급한다. 콘텐츠 수정이 테스트를 깨면 콘텐츠가 아니라 어느 쪽이 진실인지 문서로 판정.
- **verify 완화 금지**: 체크리스트 항목 삭제·임계 완화로 통과시키는 수정은 반려. 실패의 올바른 대응은 사이트 수정이다.
- **시각 판단은 사람 전용**: 에이전트는 tokens.css 기본값으로 구현까지만. 서체·간격·색 조정은 스모크 리뷰에서 토큰 값 변경으로 — 라이브러리 추가·구조 변경으로 해결하지 않는다.
- **평가 프로젝트라는 정체성**: 기능 욕심(검색·다크모드)이 생기면 대기열로 — 이 레포의 완료는 EVAL-KEYSTATIC.md다.

## 3. 일일 운영 루틴

1. 착수 가능 태스크 확인 → 레인별 worktree 배정 (여섯 레포 공용 큐)
2. 실행 중 개입하지 않는다 — 그 시간에 시드 콘텐츠 주제·평가 메모 항목을 다듬는다
3. 완료 보고 → check(+verify) 재실행 → diff 리뷰 → 머지 → 상태 갱신
4. 격주: CLAUDE.md 프루닝, TASKS 정리

## 4. 자율성의 한계선 (사람이 잡는 것)

- 시각 리뷰·서체 최종안·토큰 값 확정
- Keystatic 편집 스모크 실행과 평가 메모의 최종 판단(실서비스 채택 여부)
- 회사명(플레이스홀더) 교체 결정
- 실배포(Vercel) 실행 여부
- GitHub 리포(Trapa-Eureka/astro-page) visibility(private→public) 전환 여부
