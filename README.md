# astro-test

**Astro + Keystatic 평가용 테스트 웹사이트** — 가상의 웹개발 회사 "Makinilya Studio"의 기술 블로그.

- 레퍼런스: https://theguardian.engineering/ 의 **레이아웃 문법만** 차용한다 — 에디토리얼 블로그 패턴(강한 세리프 헤드라인, 최신순 기사 리스트 홈, 단일 칼럼 기사 페이지). **콘텐츠·로고·전용 서체·문구는 일절 복제하지 않는다** (SPEC §2의 금지 목록).
- 콘텐츠는 전부 자작: 가상 회사 Makinilya Studio(마키닐야 = 타갈로그어 "타자기")의 픽션 저자 3인이 쓴 웹개발 기술 포스트 6~8편. 회사명·저자명은 언제든 교체 가능한 플레이스홀더.
- 이 프로젝트의 진짜 목적: **Keystatic을 실서비스 CMS 후보로 평가**하는 것. 완료 시 "Keystatic 평가 메모"가 산출물에 포함된다 (T10).

## 스택 요약

Astro(최신 안정, TS strict) + Keystatic(local 모드, 관리자 UI는 개발 전용) + React·Markdoc 통합 + 자작 CSS 디자인 토큰 + 셀프호스팅 오픈 폰트. 프로덕션 빌드는 `SKIP_KEYSTATIC=true`로 관리자 라우트를 제외한 완전 정적 사이트다.

## 문서 맵

| 문서 | 내용 | 읽는 시점 |
|---|---|---|
| `CLAUDE.md` | 에이전트 스티어링 — 스택, 명령어, 규칙, 가드레일 | 모든 에이전트 세션 시작 시 (자동 로드) |
| `docs/SPEC.md` | 제품 스펙 — 레퍼런스 차용 범위·금지 목록, 페이지 구성, 평가 목적 | 기능 논의·범위 판단 전 |
| `docs/DESIGN.md` | 기술 설계 — 콘텐츠 모델(이중 스키마), 라우트, 빌드 베리파이어 | 구현 전 필독 |
| `docs/TESTING.md` | 테스트 전략 — 스키마 패리티, dist 검사(브라우저 0) | 테스트 작성 전 |
| `docs/TASKS.md` | 태스크 백로그 — 에이전트 실행 단위, 완료 기준 | 작업 배정 시 |
| `docs/WORKFLOW.md` | AI-native 개발 규칙 (공통 + 이 레포 특이사항) | 최초 1회 + 운영 중 참조 |

## 개발 방식

앞선 다섯 레포와 동일: **문서 → 에이전트 구현 → 검증**. 사람(Jin)은 스펙·시각 리뷰·Keystatic 편집 스모크, 구현은 Claude Code가 `docs/TASKS.md` 단위로. 공통 게이트는 `npm run check`, 사이트 품질 게이트는 `npm run verify`(빌드 산출물 검사).

## 퀵스타트 (T0 완료 후 유효)

```bash
npm install
npm run check      # astro check + lint + test — 공통 게이트
npm run dev        # 개발 서버 (+ /keystatic 관리자 UI)
npm run build && npm run verify   # 정적 빌드 + dist 검증 스위트
```

## 상태

- 2026-09-06: 문서 단계 (코드 미작성). T0부터 시작.
- 2026-09-07: **T0 완료** — Astro 7.3.1(TS strict) 스캐폴딩 + react/markdoc/keystatic 통합(SKIP_KEYSTATIC 조건부 마운트) + ESLint(flat config)/Prettier/Vitest(unit·verify 프로젝트) 배선. `npm run check`·`npm run build` 그린, dev에서 `/keystatic` 200 확인, dist에 keystatic·React 런타임 청크 없음 확인. 콘텐츠 모델(T1)은 다음 세션.
- 2026-09-07: **T1 완료** — keystatic.config.ts(posts/authors 컬렉션 + settings 싱글턴, DESIGN §2 표) + src/content.config.ts(zod, cover/alt refine) + src/content.schemas.ts(테스트 가능한 zod 셰이프 분리, astro:content 가상 모듈 밖에서도 import 가능) + tests/content-parity.test.ts(필드 키 집합·필수 여부 패리티, 네거티브 케이스 포함). 시드: 포스트 7편(draft 1·다저자 1·커버 2/무커버 5·태그 10종 일부 중복), 저자 3인, settings. `npm run check`·`npm run build` 그린.
- 2026-09-07: **T2 완료** — src/styles/{tokens,base,prose}.css(DESIGN §4 토큰값), Inter·Source Serif 4 셀프호스팅(가변 폰트 woff2, public/fonts/ — 위도 화이트리스트 없이 latin 서브셋만), BaseLayout(랜드마크·스킵 링크·title/description/OG 메타 슬롯) + Header/Footer(settings 싱글턴 사용). `npm run check`·`npm run build` 그린, dist에 외부 origin 참조 0(자체 placeholder 도메인 canonical/OG만) 확인.
- 2026-09-07: **T3 완료**(레인 A) — src/lib/postFilters.ts(publishedPosts·totalPages·pageHref, 전부 단위 테스트) + src/lib/formatDate.ts(고정 로케일/UTC, 단위 테스트) + PostCard·AuthorLine·Pagination 컴포넌트 + `/`(페이지 1)·`/page/[page]`(페이지 2+) 라우트. 페이지네이션 경계(1페이지=`/`, 2페이지부터 `/page/N`, prev/next 체이닝)를 pageSize 임시로 낮춰 실제 빌드로 검증 후 원복. `npm run check`(33/33)·`npm run build` 그린.
- 2026-09-07: **T4 완료**(레인 B) — src/lib/readingTime.ts·tagSlug.ts(둘 다 단위 테스트, tagSlug는 유니코드·멱등성 포함) + `/posts/[slug]` 상세 페이지(저자·날짜·읽기시간 메타, Markdoc 렌더, 태그 링크, 커버 유무 분기). markdoc.config.mjs를 새로 만들어 `@astrojs/markdoc/shiki` 확장을 붙임 — 기본값으로는 코드펜스가 하이라이팅 없이 렌더된다는 걸 실제 빌드로 확인 후 고침. draft 포스트는 dev에서만 보이고(200 확인) 프로덕션 빌드에서 라우트 자체가 생성 안 됨(확인). `npm run check`(45/45)·`npm run build` 그린.
- 2026-09-07: **T5 완료**(레인 C) — src/lib/tagGroups.ts(groupPostsByTagSlug, tagSlug 재사용·단위 테스트) + `/tags/[tag]`(태그별 리스트, 10개 태그 페이지 생성 확인) + `/about`(픽션 회사 소개 + 저자 3인) + `/404`(홈·최신 글 링크). 라우트 생성과 포스트 상세의 태그 링크가 정확히 같은 tagSlug 경유임을 소스 레벨 테스트로 확인 — 한쪽을 일부러 깨서 테스트가 실패하는 것까지 확인 후 원복. `npm run check`(51/51)·`npm run build`(19 페이지) 그린.
