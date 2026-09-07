# TASKS — astro-test v0.1 백로그

## 사용법

- 한 에이전트 세션 = 한 태스크. 프롬프트 템플릿:
  > `docs/SPEC.md`, `docs/DESIGN.md`, `docs/TESTING.md`를 읽고 **T3**을 수행해. 완료 기준을 전부 충족하고 `npm run check`(T7 이후엔 verify 포함)가 통과할 때까지 스스로 수정해. 끝나면 변경 파일과 검증 결과를 요약해.
- 완료 시 상태 `DONE(날짜)` + 커밋(`T{n}: 요약`).
- 병렬 레인: T2 완료 후 **A(T3), B(T4), C(T5), D(T6)** 는 서로 다른 worktree 에이전트로 동시 진행 가능.

의존 그래프: `T0 → T1 → T2 → {A: T3, B: T4, C: T5, D: T6} → T7 → T8 → T9 → T10`

---

### T0 — 스캐폴딩 + 통합 배선 · 상태: DONE(2026-09-07)
- 목표: Astro 최신 안정으로 프로젝트 생성(버전을 README 상태 절에 기록), TS strict, react·markdoc·keystatic 통합 + `SKIP_KEYSTATIC` 조건 마운트, ESLint/Prettier/Vitest, 스크립트 일체(check/dev/build/verify/preview), `.env.example`, `.gitignore`.
- 완료 기준: [ ] `npm run check` 통과 [ ] dev에서 `/keystatic` 응답 [ ] `npm run build` 성공 + dist에 keystatic 경로 부재(임시 수동 확인) [ ] git init + 첫 커밋

### T1 — 콘텐츠 모델 + 시드 · 상태: TODO · 의존: T0
- 목표: keystatic.config.ts(3컬렉션, DESIGN §2 표 그대로) + content.config.ts(zod, cover/alt refine) + **패리티 테스트** + 시드 콘텐츠(자작 픽션: 포스트 7편 — draft 1·다저자 1·커버 유무 혼합, 저자 3인, settings).
- 완료 기준: [ ] 패리티 테스트 통과(필드 하나 빼면 실패함을 확인하는 네거티브 케이스 포함) [ ] cover/alt refine 테스트 [ ] 콘텐츠에 레퍼런스 흔적 0(자작 확인) [ ] check 통과

### T2 — 디자인 토큰 + 베이스 레이아웃 · 상태: TODO · 의존: T1
- 목표: tokens.css(§4)·base.css·prose.css, 오픈 폰트 woff2 셀프호스팅(public/fonts), BaseLayout(랜드마크·스킵 링크·메타 슬롯), Header/Footer(settings 싱글턴 사용).
- 완료 기준: [ ] 외부 origin 참조 0 [ ] 랜드마크·스킵 링크 존재(단위 렌더 테스트 또는 dev 확인 스크립트) [ ] check 통과

### T3 (레인 A) — 홈 리스트 + 페이지네이션 · 상태: TODO · 의존: T2
- 목표: `/` 최신순 리스트(PostCard: 제목·저자·날짜·발췌), `paginate()` 10개, `/page/N`.
- 완료 기준: [ ] publishedPosts 경유(직접 정렬 금지) [ ] 페이지 수 산식 단위 테스트 [ ] check 통과

### T4 (레인 B) — 포스트 상세 · 상태: TODO · 의존: T2
- 목표: `/posts/[slug]` — 메타(저자들·날짜·읽기 시간), Markdoc 렌더, Shiki 코드블록, 태그 링크, 프로즈 스타일 적용.
- 완료 기준: [ ] readingTime·formatDate lib 사용 [ ] 커버 없는 글 레이아웃 정상 [ ] check 통과

### T5 (레인 C) — 태그·어바웃·404 · 상태: TODO · 의존: T2
- 목표: `/tags/[tag]`(tagSlug 정규화 공용), `/about`(픽션 회사·저자 3인), `/404`.
- 완료 기준: [ ] 태그 라우트와 링크가 같은 함수 사용(불일치 테스트) [ ] check 통과

### T6 (레인 D) — RSS·sitemap·SEO · 상태: TODO · 의존: T2
- 목표: rss.xml(@astrojs/rss)·sitemap 통합·페이지별 title/description/OG 슬롯 채움.
- 완료 기준: [ ] RSS가 publishedPosts 경유 [ ] 메타 슬롯 누락 시 타입 에러(필수 prop) [ ] check 통과

### T7 — 빌드 베리파이어 · 상태: TODO · 의존: T3~T6
- 목표: `scripts/verify/` vitest 프로젝트 — TESTING §4 체크리스트 전 항목 구현, `npm run verify`.
- 완료 기준: [ ] **§4 전 항목 그린** [ ] 의도적 훼손(링크 하나 깨기) 시 정확히 그 항목이 실패하는 네거티브 확인 [ ] check 통과

### T8 — 정책 마감 · 상태: TODO · 의존: T7
- 목표: draft 제외 전 경로 재확인, keystatic·React 런타임 dist 부재 검사 강화, 금지 문자열 스캔, 용량 예산 리포트.
- 완료 기준: [ ] verify 정책 항목 전부 그린 [ ] check 통과

### T9 — 마무리 통합 · 상태: TODO · 의존: T8
- 목표: 시드 콘텐츠 다듬기(발췌·태그 정리), 콘솔 경고 0, README 퀵스타트 실명령 갱신.
- 완료 기준: [ ] check + verify 전부 그린 [ ] `npm run preview` 기동 확인

### T10 — 사람 스모크 + 평가 메모 · 상태: TODO · 의존: T9
- 목표: TESTING §5 스모크(Keystatic 편집→빌드 반영), `docs/EVAL-KEYSTATIC.md` 작성(편집 UX·스키마 표현력·패리티 유지 비용·실서비스 채택 판단), Cloudflare Pages 배포 절차 문서화(실행은 선택).
- 완료 기준: [ ] 스모크 체크리스트 수행 기록 [ ] 평가 메모 완성 [ ] 배포 절차 5줄 이내

---

## 확장 대기열 (착수 금지 — 테스트 프로젝트 범위 밖)

- 검색 / 다크모드 / 다국어 / Keystatic GitHub 모드 / 실배포 자동화 — 평가 결과가 긍정일 때 실서비스 레포에서
