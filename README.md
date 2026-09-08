# astro-test

**Astro + Keystatic 평가용 테스트 웹사이트** — 가상의 웹개발 회사 "Makinilya Studio"의 기술 블로그.

- 레퍼런스: https://theguardian.engineering/ 의 **레이아웃 문법만** 차용한다 — 에디토리얼 블로그 패턴(강한 세리프 헤드라인, 최신순 기사 리스트 홈, 단일 칼럼 기사 페이지). **콘텐츠·로고·전용 서체·문구는 일절 복제하지 않는다** (SPEC §2의 금지 목록).
- 콘텐츠는 전부 자작: 가상 회사 Makinilya Studio(마키닐야 = 타갈로그어 "타자기")의 픽션 저자 3인이 쓴 웹개발 기술 포스트 6~8편. 회사명·저자명은 언제든 교체 가능한 플레이스홀더.
- 이 프로젝트의 진짜 목적: **Keystatic을 실서비스 CMS 후보로 평가**하는 것. 완료 시 "Keystatic 평가 메모"가 산출물에 포함된다 (T10).

## 스택 요약

Astro(최신 안정, TS strict) + Keystatic(로컬은 local 모드, Vercel 프로덕션은 GitHub 모드 — 환경변수로 자동 분기) + React·Markdoc 통합 + `@astrojs/vercel` 어댑터 + 자작 CSS 디자인 토큰 + 셀프호스팅 오픈 폰트. 공개 콘텐츠 페이지는 완전 정적, `/keystatic`·`/api/keystatic`만 온디맨드 서버 렌더링(GitHub OAuth 보호).

## 문서 맵

| 문서 | 내용 | 읽는 시점 |
|---|---|---|
| `CLAUDE.md` | 에이전트 스티어링 — 스택, 명령어, 규칙, 가드레일 | 모든 에이전트 세션 시작 시 (자동 로드) |
| `docs/SPEC.md` | 제품 스펙 — 레퍼런스 차용 범위·금지 목록, 페이지 구성, 평가 목적 | 기능 논의·범위 판단 전 |
| `docs/DESIGN.md` | 기술 설계 — 콘텐츠 모델(이중 스키마), 라우트, 빌드 베리파이어 | 구현 전 필독 |
| `docs/TESTING.md` | 테스트 전략 — 스키마 패리티, dist 검사(브라우저 0) | 테스트 작성 전 |
| `docs/TASKS.md` | 태스크 백로그 — 에이전트 실행 단위, 완료 기준 | 작업 배정 시 |
| `docs/WORKFLOW.md` | AI-native 개발 규칙 (공통 + 이 레포 특이사항) | 최초 1회 + 운영 중 참조 |
| `docs/EVAL-KEYSTATIC.md` | Keystatic 평가 메모 — 이 프로젝트의 진짜 산출물(T10) | 채택 여부 판단 시 |

## 개발 방식

앞선 다섯 레포와 동일: **문서 → 에이전트 구현 → 검증**. 사람(Jin)은 스펙·시각 리뷰·Keystatic 편집 스모크, 구현은 Claude Code가 `docs/TASKS.md` 단위로. 공통 게이트는 `npm run check`, 사이트 품질 게이트는 `npm run verify`(빌드 산출물 검사).

## 퀵스타트

```bash
npm install
npm run check      # astro check + lint + format:check + vitest(unit) — 공통 게이트
npm run dev        # 개발 서버: http://localhost:4321 (+ /keystatic 관리자 UI)
npm run build       # 정적 빌드(어댑터 포함) → dist/client(공개 페이지) + 서버 함수(/keystatic)
npm run verify      # 빌드 산출물 검사 스위트 (빌드 후 실행, cheerio+fs만, dist/client만 검사)
npm run preview     # dist/client 로컬 미리보기 (vite preview — astro preview는 어댑터가 미지원)
```

`package.json`에 새 의존성이 추가된 커밋을 받은 뒤에는(`git pull` 직후) `npm install`을 먼저
해야 `npm run dev`/`verify`가 정상 동작한다 — `node_modules`는 git에 커밋되지 않는다.

**라우트**: `/`(홈, 페이지네이션 `/page/2`~) · `/posts/[slug]` · `/tags/[tag]` · `/about` ·
`/404` · `/rss.xml` · `/sitemap-index.xml` · `/keystatic`(로컬은 local 모드, 배포된
사이트에선 GitHub OAuth 로그인 — `docs/EVAL-KEYSTATIC.md` §6~§7).

## 상태

- 2026-09-06: 문서 단계 (코드 미작성). T0부터 시작.
- 2026-09-07: **T0 완료** — Astro 7.3.1(TS strict) 스캐폴딩 + react/markdoc/keystatic 통합(SKIP_KEYSTATIC 조건부 마운트) + ESLint(flat config)/Prettier/Vitest(unit·verify 프로젝트) 배선. `npm run check`·`npm run build` 그린, dev에서 `/keystatic` 200 확인, dist에 keystatic·React 런타임 청크 없음 확인. 콘텐츠 모델(T1)은 다음 세션.
- 2026-09-07: **T1 완료** — keystatic.config.ts(posts/authors 컬렉션 + settings 싱글턴, DESIGN §2 표) + src/content.config.ts(zod, cover/alt refine) + src/content.schemas.ts(테스트 가능한 zod 셰이프 분리, astro:content 가상 모듈 밖에서도 import 가능) + tests/content-parity.test.ts(필드 키 집합·필수 여부 패리티, 네거티브 케이스 포함). 시드: 포스트 7편(draft 1·다저자 1·커버 2/무커버 5·태그 10종 일부 중복), 저자 3인, settings. `npm run check`·`npm run build` 그린.
- 2026-09-07: **T2 완료** — src/styles/{tokens,base,prose}.css(DESIGN §4 토큰값), Inter·Source Serif 4 셀프호스팅(가변 폰트 woff2, public/fonts/ — 위도 화이트리스트 없이 latin 서브셋만), BaseLayout(랜드마크·스킵 링크·title/description/OG 메타 슬롯) + Header/Footer(settings 싱글턴 사용). `npm run check`·`npm run build` 그린, dist에 외부 origin 참조 0(자체 placeholder 도메인 canonical/OG만) 확인.
- 2026-09-07: **T3 완료**(레인 A) — src/lib/postFilters.ts(publishedPosts·totalPages·pageHref, 전부 단위 테스트) + src/lib/formatDate.ts(고정 로케일/UTC, 단위 테스트) + PostCard·AuthorLine·Pagination 컴포넌트 + `/`(페이지 1)·`/page/[page]`(페이지 2+) 라우트. 페이지네이션 경계(1페이지=`/`, 2페이지부터 `/page/N`, prev/next 체이닝)를 pageSize 임시로 낮춰 실제 빌드로 검증 후 원복. `npm run check`(33/33)·`npm run build` 그린.
- 2026-09-07: **T4 완료**(레인 B) — src/lib/readingTime.ts·tagSlug.ts(둘 다 단위 테스트, tagSlug는 유니코드·멱등성 포함) + `/posts/[slug]` 상세 페이지(저자·날짜·읽기시간 메타, Markdoc 렌더, 태그 링크, 커버 유무 분기). markdoc.config.mjs를 새로 만들어 `@astrojs/markdoc/shiki` 확장을 붙임 — 기본값으로는 코드펜스가 하이라이팅 없이 렌더된다는 걸 실제 빌드로 확인 후 고침. draft 포스트는 dev에서만 보이고(200 확인) 프로덕션 빌드에서 라우트 자체가 생성 안 됨(확인). `npm run check`(45/45)·`npm run build` 그린.
- 2026-09-07: **T5 완료**(레인 C) — src/lib/tagGroups.ts(groupPostsByTagSlug, tagSlug 재사용·단위 테스트) + `/tags/[tag]`(태그별 리스트, 10개 태그 페이지 생성 확인) + `/about`(픽션 회사 소개 + 저자 3인) + `/404`(홈·최신 글 링크). 라우트 생성과 포스트 상세의 태그 링크가 정확히 같은 tagSlug 경유임을 소스 레벨 테스트로 확인 — 한쪽을 일부러 깨서 테스트가 실패하는 것까지 확인 후 원복. `npm run check`(51/51)·`npm run build`(19 페이지) 그린.
- 2026-09-07: **T6 완료**(레인 D, 병렬 레인 전부 완료) — `@astrojs/rss`·`@astrojs/sitemap` 설치, `/rss.xml`(publishedPosts 경유, 발행 6편) + sitemap(`site` 설정 필요 — T2에서 이미 넣어둔 placeholder 도메인 재사용, 18 URL·draft·404·keystatic 자동 제외 확인). BaseLayout의 title/description이 필수 prop이라 누락 시 실제로 astro check 타입 에러 나는 것 확인. `npm run check`(53/53)·`npm run build` 그린. T3~T6 전부 완료 — 다음은 T7(빌드 베리파이어).
- 2026-09-07: **T7 완료** — `scripts/verify/`(vitest verify 프로젝트, cheerio+fs만, 75개 검사) — TESTING.md §4 체크리스트 전 항목: 포스트 페이지·h1 유일성, 내부 링크+앵커 무결성, 404 링크, 페이지네이션 산식, 전 페이지 title/description/OG, rss.xml 파싱·항목 수·draft 부재, sitemap URL 수·draft·keystatic 부재, img alt 100%, 랜드마크·스킵 링크, 외부 origin 참조 0, keystatic·JS런타임 부재, 페이지 용량 100KB, 금지 문자열 스캔. **실제 버그 발견**: 홈(`/`)·`/page/N`에 h1이 아예 없었음 — visually-hidden h1 추가해서 고침. 네거티브 확인: dist의 링크 하나를 실제로 깨서 정확히 그 검사만 실패하는 것 확인 후 원복. `npm run check`(53/53)·`npm run verify`(75/75) 그린.
- 2026-09-07: **T8 완료** — draft 제외를 dist 전 경로(라우트 부재 + 어디서도 링크 안 됨)로 재확인, `/keystatic` href 스캔 정밀화(경로·JS파일·script태그 3중 확인 — 처음엔 콘텐츠 텍스트 전수 스캔으로 시도했다가 "Shipping a CMS..." 포스트 본문이 정당하게 "Keystatic"을 언급해서 오탐 발생 → href 기반 검사로 교체), 금지 문자열 목록·확장자 확대(.mjs/.json 포함), 페이지 용량 리포트(`scripts/verify/reports/page-sizes.json`, gitignore 대상) 추가. 네거티브 확인(draft 링크 실제로 심어봄) 통과. `npm run check`(53/53)·`npm run verify`(80/80) 그린.
- 2026-09-08: **T9 완료** — 시드 콘텐츠(발췌·태그) 재검토: 발췌 전부 200자 제한 내(122~148자), 태그 10종 중복 없이 정리돼 있음을 확인, 수정 불필요. 실제 브라우저로 홈/포스트(커버 유무 모두)/태그/about/404/`/keystatic`(dev)를 열어 콘솔 확인 — warning·error 0(React DevTools 안내 같은 정상 INFO 로그만). README 퀵스타트를 실제 명령어·라우트 목록으로 갱신. `npm run check`(53/53)·`npm run verify`(80/80) 그린, `npm run preview` 기동 확인(홈·포스트·rss.xml 200). T0~T9 전부 완료 — 다음은 T10(사람 스모크 + 평가 메모).
- 2026-09-08: **T10 완료** — `/keystatic`에서 실제로 포스트 신규 작성(커버·저자·태그 포함)→파일 생성 확인→draft 토글→빌드 반영/제외 확인→**삭제**까지 CRUD 전체를 실행(삭제 시 첨부 이미지가 안 지워지는 걸 발견, 수동 정리 후 재확인). `docs/EVAL-KEYSTATIC.md` 작성 — 편집 UX·스키마 표현력(이미지 필드의 image() 비호환, 조건부 필수 미지원)·패리티 유지 비용(실측 근거 포함) 정리, 실서비스 채택은 조건부 권장으로 초안 작성(최종 판단은 사람 몫). 배포 절차를 Cloudflare Pages→Vercel로 전환해 5줄로 문서화(`docs/SPEC.md`·`WORKFLOW.md`도 함께 갱신). 시각 리뷰(서체·간격·모바일 폭)는 WORKFLOW.md §4에 따라 사람 확인 대기. `npm run check`(53/53)·`npm run verify`(80/80) 그린. **T0~T10 전부 완료** — 남은 건 사람의 시각 리뷰 + 평가 메모 최종 승인 + 리포 visibility·배포 실행 여부 결정.
- 2026-09-08: **Keystatic GitHub 모드 도입**(사용자가 Vercel에 배포한 뒤 `/keystatic`이 404라 요청) — 사용자 요청으로 T10에서 확정한 "local 모드만" 범위를 확장. `@astrojs/vercel` 어댑터 추가(공개 페이지는 여전히 정적, `/keystatic`·`/api/keystatic`만 온디맨드), `keystatic.config.ts`가 `PUBLIC_KEYSTATIC_STORAGE` 환경변수로 local/github storage 자동 분기. 실제 버그 2개 발견해서 고침: (1) `process.env`로 분기했더니 브라우저 번들에서 `ReferenceError: process is not defined`로 관리자 UI가 아예 안 뜸 — `import.meta.env`의 `PUBLIC_` 접두사 변수로 교체해서 해결(로컬 재현·수정 확인 완료), (2) `@astrojs/vercel`은 `astro preview`를 지원 안 해서 `npm run preview`가 깨짐 — `vite preview --outDir dist/client`로 교체. `dist/` 구조도 `dist/client/`로 바뀌어서 `scripts/verify/`의 DIST_DIR과 "keystatic·JS 부재" 검사 2개를 "공개 페이지가 참조 안 하는지"로 재설계(원본 파일 자체는 어드민 클라이언트 번들이라 이제 정당하게 존재함). CLAUDE.md 가드레일 3 개정, SPEC.md §8 추가. `npm run check`(53/53)·`npm run verify`(79/79)·`npm run build`·`npm run preview` 전부 실측 그린. GitHub OAuth App 생성·Vercel 환경변수 등록(4개)은 사용자 몫 — `docs/EVAL-KEYSTATIC.md` §7.
