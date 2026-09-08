# CLAUDE.md — astro-test 스티어링

Astro + Keystatic 평가용 테스트 사이트(가상 회사 Makinilya Studio 기술 블로그). 스펙은 `docs/SPEC.md`, 설계는 `docs/DESIGN.md`.

## 스택

- Astro 최신 안정(T0에서 버전 확정·기록), TypeScript **strict**
- Keystatic: `@keystatic/core` + `@keystatic/astro`, storage는 `keystatic.config.ts`에서 환경변수로 분기 — 로컬은 local(직접 파일 쓰기), 프로덕션(Vercel)은 GitHub 모드(OAuth). 관리자 UI(`/keystatic`)는 이제 프로덕션에도 존재하지만 GitHub OAuth로 보호됨(저장소 쓰기 권한 있는 계정만 인증 가능) — 2026-09-08 결정, `docs/EVAL-KEYSTATIC.md` 참고.
- 통합: `@astrojs/react`(Keystatic 관리자용) + `@astrojs/markdoc`(콘텐츠) + `@astrojs/vercel`(어댑터, `/keystatic`·`/api/keystatic`만 온디맨드 서버 렌더링) — 공개 콘텐츠 페이지(홈·포스트·태그·about·404·rss·sitemap)는 여전히 React 아일랜드 없는 순수 정적 프리렌더
- 스타일: 자작 CSS + 디자인 토큰(`src/styles/tokens.css`), 셀프호스팅 오픈 폰트 — 외부 CDN·폰트 서비스 금지
- 부속: `@astrojs/rss`, `@astrojs/sitemap`, 코드 하이라이트는 Astro 내장 Shiki
- 검증: `astro check` + ESLint + Prettier + Vitest, dist 검사는 cheerio(브라우저·네트워크 0)

## 명령어

```bash
npm run check      # astro check + lint + format check + vitest — 태스크 완료의 필수 게이트
npm run test       # vitest run
npm run dev        # 개발 서버 (+ /keystatic, local 모드)
npm run build      # astro build — 공개 페이지는 정적, /keystatic·/api/keystatic만 온디맨드
npm run verify     # dist 검증 스위트 (TESTING §4) — 빌드 후 실행
npm run preview    # 빌드 결과 로컬 미리보기 (사람용)
```

## 소스 레이아웃

```
keystatic.config.ts        # 편집 스키마 (Keystatic)
src/
  content.config.ts        # 소비 스키마 (Astro 컬렉션, zod) — keystatic과 패리티 테스트로 동기화
  content/{posts,authors,settings}/   # Keystatic이 쓰고 Astro가 읽는 콘텐츠 파일
  layouts/  components/    # BaseLayout, Header, Footer, PostCard, AuthorLine, Pagination
  pages/                   # index, posts/[slug], tags/[tag], about, rss.xml, 404
  styles/                  # tokens.css, base.css, prose.css
  lib/                     # readingTime, formatDate, tagSlug, postFilters (순수 함수)
scripts/verify/            # dist 검사 스위트 (vitest로 실행)
tests/                     # 단위 + 패리티
```

## 컨벤션

- 콘텐츠 모델의 진실의 원천은 `docs/DESIGN.md` §2. keystatic.config와 content.config 둘 다 그 표를 따르고, 패리티 테스트가 드리프트를 잡는다.
- `src/lib/`는 순수 함수만 — 페이지 프런트매터 로직은 lib로 빼서 단위 테스트한다.
- 이미지 필드는 alt 텍스트 필수(스키마 강제). 시맨틱 랜드마크(header/main/footer)·페이지당 h1 1개.
- `any` 금지, 콘텐츠 경계는 zod. 에러 메시지는 원인 + 수정 방법까지.
- 커밋 메시지: `T{n}: 요약`.

## 가드레일 (위반 금지)

1. **레퍼런스 복제 금지**: The Guardian의 문장·헤드라인·로고·전용 서체(Guardian Egyptian/Headline 등)·아이콘을 코드·콘텐츠·에셋 어디에도 넣지 않는다. 차용은 SPEC §2의 "레이아웃 문법" 목록까지만.
2. **콘텐츠는 자작 픽션만**: 실존 회사·인물·사건에 대한 사실 주장 금지. 저자·회사·프로젝트 전부 가상이며, 기술 설명은 일반 지식 수준으로.
3. **공개 콘텐츠 페이지는 항상 완전 정적·0 JS 유지**(2026-09-08 이전 가드레일이었던 "프로덕션에 /keystatic 전면 금지"는 사용자 요청으로 폐기 — `/keystatic`·`/api/keystatic`는 이제 프로덕션에도 존재하지만 GitHub OAuth로 보호되는 별도 온디맨드 라우트이며, `scripts/verify/`가 검사하는 정적 `dist/` 산출물 범위 밖이다). 홈·포스트·태그·about·404·rss·sitemap이 여전히 순수 정적인지는 verify로 계속 강제.
4. 외부 요청 0의 정적 사이트: 폰트·스크립트·애널리틱스 등 서드파티 로드 금지. verify가 dist에서 외부 URL 참조를 검사한다.
5. 테스트·verify에서 네트워크 호출 0건. dist 검사는 파일시스템+cheerio로만.
6. `npm run verify` 체크리스트의 삭제·완화 금지 — 실패의 올바른 대응은 사이트 수정이다.

## 작업 방식

- 한 세션 = `docs/TASKS.md`의 한 태스크. 완료 기준 전부 충족 + `npm run check` 통과(해당 시 verify 포함)까지 자가 수정 루프. 스펙 모호로 막힐 때만 질문.
- 시각적 판단(간격·서체 크기 등)은 토큰 기본값으로 구현하고 사람 리뷰에 맡긴다 — 임의로 라이브러리를 추가하지 않는다.

## 프루닝 로그

격주 검토, 낡은 규칙 삭제 (`docs/WORKFLOW.md`).

- 2026-09-06: 최초 작성.
- 2026-09-08: 가드레일 3 개정 — Keystatic GitHub 모드 도입으로 `/keystatic`이 프로덕션에도 존재(OAuth 보호). 스택·명령어 섹션도 함께 갱신.
