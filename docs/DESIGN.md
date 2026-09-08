# DESIGN — astro-test v0.1

이 문서가 구현의 진실의 원천이다. 콘텐츠 모델·라우트·verify 규칙 변경은 문서 수정이 먼저다.

## 1. 아키텍처

```
[로컬 편집]  npm run dev ──► /keystatic (관리자 UI, React) ──► src/content/* 파일 쓰기
                                                            (storage: local — 시크릿 없을 때)
[배포 편집]  https://<도메인>/keystatic ──► GitHub OAuth 로그인 ──► GitHub API로 커밋
                                          (storage: github — Vercel에 시크릿 있을 때)
[소비]      Astro 콘텐츠 컬렉션(content.config.ts, zod) ──► 페이지 정적 생성
[배포]      astro build (어댑터: @astrojs/vercel) ──► dist/ = 공개 페이지(완전 정적)
                                                     + /keystatic·/api/keystatic(온디맨드)
[검증]      npm run verify ──► 정적 dist만 cheerio로 검사 (TESTING §4, 온디맨드 라우트는 범위 밖)
```

- 통합: `integrations: [markdoc(), sitemap(), react(), keystatic()]` — 전부 무조건 포함(2026-09-08
  이전엔 `SKIP_KEYSTATIC`으로 react()·keystatic()을 프로덕션에서 뺐으나, GitHub 모드로
  `/keystatic`을 프로덕션에도 노출하기로 하면서 그 배선을 걷어냈다). `adapter: vercel()` 추가.
  `@keystatic/astro`의 `keystatic()`이 `/keystatic/[...params]`와 `/api/keystatic/[...params]`
  두 라우트를 `injectRoute(..., { prerender: false })`로 직접 주입하므로, 다른 페이지는 손대지
  않아도 이 둘만 온디맨드가 된다 — `output: 'static'`(기본값) 그대로 두고 어댑터만 있으면 되는
  구조(Astro의 `hybridOutput` 어댑터 기능). `storage`는 `keystatic.config.ts`에서
  `KEYSTATIC_GITHUB_CLIENT_ID` 존재 여부로 local/github를 자동 분기 — 로컬 개발은 시크릿 없이
  local 모드 그대로.
- 같은 파일을 Keystatic이 쓰고 Astro가 읽는다 — 두 스키마의 동기화는 패리티 테스트(§2 하단)가 강제한다.

## 2. 콘텐츠 모델 (이중 스키마의 단일 진실)

### posts — `src/content/posts/*` (format: contentField=content, Markdoc)

| 필드 | Keystatic | Astro(zod) | 규칙 |
|---|---|---|---|
| title | fields.slug | string | slugField |
| excerpt | fields.text | string(≤200) | 리스트·메타 설명용 |
| pubDate | fields.date | coerce.date | 최신순 정렬 키 |
| authors | fields.array(relationship→authors) | array(reference) | 1명 이상 |
| tags | fields.array(text) | array(string) | 소문자 케밥(정규화 함수 경유) |
| cover | fields.image(옵션) + coverAlt(text) | string(옵션)+string | **cover 있으면 alt 필수** (refine) |
| draft | fields.checkbox(기본 false) | boolean | 프로덕션 제외 |
| content | fields.markdoc | body | 본문 |

**cover가 `image()`가 아니라 `string`인 이유(T1에서 실측)**: Keystatic의 `fields.image()`는 프런트매터에 `publicPath` 기반 공개 URL 문자열(예: `/posts-images/<slug>/cover.png`)을 쓰고, 실제 파일은 `directory`(고정 경로, 슬러그 하위 폴더 자동 생성)에 저장한다 — 엔트리 파일 기준 상대경로가 아니라서 Astro 콘텐츠 컬렉션의 `image()`(Vite로 처리되는 콜로케이션 상대경로를 기대)와 맞지 않는다. 그래서 이미지 디렉터리를 `public/posts-images`로 두고(공개 URL과 실제 위치가 일치), zod는 `z.string().optional()`로 그 URL 문자열을 그대로 받는다 — Vite 이미지 최적화(width/height 자동 추론)는 포기하지만 이 평가용 사이트엔 충분하다.

### authors — `src/content/authors/*`

name(slug) · role(text) · bio(text ≤300). 픽션 3인 시드.

### settings — 싱글턴 `src/content/settings/site`

siteTitle · description · footerNote. 회사명 교체는 여기 1곳.

**패리티 테스트**: keystatic.config의 컬렉션·필드 키 집합과 필수 여부를 introspect해 content.config의 zod 스키마 shape와 비교한다. 필드 추가·삭제·필수성 변경이 한쪽에만 반영되면 테스트 실패 — 이것이 이중 스키마의 드리프트 게이트다.

## 3. 라우팅·데이터 흐름

- `src/lib/postFilters.ts`: `publishedPosts(all, {includeDrafts})` — 정렬(최신순)·draft 제외를 한 곳에서. 홈·태그·RSS·sitemap 전부 이 함수만 사용(정책 단일화).
- 페이지네이션: Astro `paginate()` 10개/페이지, `/page/N`.
- 태그: `tagSlug()` 정규화(소문자·케밥·유니코드 허용) — 링크 생성과 라우트 생성이 같은 함수 사용.
- 읽기 시간: `readingTime(markdocSource)` 단어수/230wpm, 순수 함수.
- RSS: `@astrojs/rss` — publishedPosts 기반, excerpt를 description으로. sitemap: `@astrojs/sitemap` 기본 + draft 제외 확인은 verify에서.

## 4. 디자인 토큰 (src/styles/tokens.css)

```css
:root {
  --font-display: "Source Serif 4", serif;   /* 셀프호스팅 woff2, T2에서 최종안 확정 */
  --font-body: "Inter", system-ui, sans-serif;
  --color-ink: #121212; --color-paper: #ffffff;
  --color-accent: #2a3d8f;                    /* 자체 딥 인디고 — 레퍼런스 색 복제 아님 */
  --measure: 68ch; --space-1..-8: 4px 스케일; --step--1..-5: 타이포 스케일(1.25 비율);
}
```

프로즈 스타일(prose.css): 헤딩 위계, 코드블록(Shiki 테마 1개), 인용, 표, 이미지 캡션. 반응형은 컨테이너 폭 + 타이포 스케일 축소 1단계(모바일).

## 5. 빌드 베리파이어 (scripts/verify/ — vitest 프로젝트)

빌드 산출물(dist/)의 **정적 프리렌더 부분**만 검사한다. 브라우저·네트워크 0, cheerio + fs.
`/keystatic`·`/api/keystatic`는 `prerender: false`라 이 dist 안에 정적 파일로 안 떨어지고
어댑터가 별도 서버리스 함수로 배포하므로, 이 스위트의 검사 범위 밖이다(2026-09-08 GitHub
모드 도입 이후에도 이 사실은 안 바뀜 — 그래서 아래 항목들도 코드 수정 없이 그대로 유효).

검사 항목(전체 목록은 TESTING §4): 전 포스트 페이지 존재 / 내부 링크·앵커 무결성 / img alt 100% / h1 유일성·랜드마크 / OG·title·description 메타 / RSS 파싱·항목 수 = 공개 포스트 수 / sitemap URL 수 일치·draft 부재 / **정적 dist에 keystatic 경로·React 런타임 청크 부재**(어댑터의 서버리스 함수 출력물은 별도 — 이 검사는 프리렌더 산출물이 여전히 순수 정적인지만 본다) / 외부 origin 참조 0 / 페이지 HTML ≤ 예산(기본 100KB, 폰트 제외) / 404 페이지 존재.

## 6. 환경변수·스크립트

```
# .env.example — 전부 비우면 로컬은 local storage로 동작 (기존과 동일)
PUBLIC_KEYSTATIC_STORAGE=        # "github"로 설정해야 storage가 github 모드로 전환됨
KEYSTATIC_GITHUB_CLIENT_ID=      # GitHub OAuth App
KEYSTATIC_GITHUB_CLIENT_SECRET=  # GitHub OAuth App
KEYSTATIC_SECRET=                # 세션 쿠키 암호화용 랜덤 문자열 (예: openssl rand -hex 32)
```

`PUBLIC_KEYSTATIC_STORAGE`가 `PUBLIC_` 접두사인 이유: `keystatic.config.ts`는 서버뿐 아니라
브라우저 번들에도 포함되는데(관리자 UI가 클라이언트에서도 스키마를 알아야 함), Vite는
`PUBLIC_` 접두사 없는 변수를 클라이언트에 안 심어준다 — `process.env`를 직접 읽게 했더니
"process is not defined"로 실제 크래시가 났다(실측). 그래서 storage kind 분기는 `import.meta.env.
PUBLIC_KEYSTATIC_STORAGE`(민감하지 않은 플래그)로 하고, 진짜 시크릿 2개는 여전히
`astro:env/server`의 `getSecret()`으로 서버에서만 읽는다.

Vercel 프로덕션엔 이 4개를 Environment Variables에 설정(값은 사람이 직접 발급 — `docs/EVAL-KEYSTATIC.md`
§7). 로컬 `.env`는 비워도 되고, 채우면 로컬에서도 GitHub 모드로 테스트 가능(실측: 값만 넣으면
"Log in with GitHub" 화면이 뜨는 것까지 확인 — 실제 로그인은 진짜 OAuth App 필요).

package.json scripts: `check`(astro check+lint+format:check+vitest --project unit), `build`(astro build — 어댑터가 있어 `/keystatic`·`/api/keystatic`만 온디맨드, 나머지는 그대로 정적), `verify`(vitest run --project verify — dist 필요), `dev`(astro dev, 시크릿 없으면 local 모드), `preview`(**`vite preview --outDir dist/client`**, `astro preview`가 아님 — 실측: `@astrojs/vercel` 어댑터는 `astro preview`를 아예 지원하지 않는다("The @astrojs/vercel adapter does not support the preview command"), 온디맨드 라우트가 있는 프로젝트는 어댑터별로 다른 방식이 필요하기 때문. `vite preview`는 `dist/client`의 정적 파일만 서빙하므로 **공개 페이지 시각 리뷰**(TESTING §5)엔 충분하지만 `/keystatic`은 못 띄운다 — `/keystatic`을 로컬에서 어댑터 포함해 통째로 재현하려면 Vercel의 `vercel dev` CLI가 필요(별도 로그인·프로젝트 연결 필요, 이 프로젝트엔 안 붙임).

## 7. 디렉터리 구조 (목표)

```
astro-test/
  CLAUDE.md  README.md  keystatic.config.ts  astro.config.mjs  .env.example
  docs/  public/fonts/  scripts/verify/
  src/{content,content.config.ts,layouts,components,pages,styles,lib}/
  tests/
```
