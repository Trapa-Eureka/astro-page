# DESIGN — astro-test v0.1

이 문서가 구현의 진실의 원천이다. 콘텐츠 모델·라우트·verify 규칙 변경은 문서 수정이 먼저다.

## 1. 아키텍처

```
[편집]  npm run dev ──► /keystatic (관리자 UI, React) ──► src/content/* 파일 쓰기
                                                        (storage: local)
[소비]  Astro 콘텐츠 컬렉션(content.config.ts, zod) ──► 페이지 정적 생성
[배포]  SKIP_KEYSTATIC=true astro build ──► dist/ (관리자 라우트·React 없음, 완전 정적)
[검증]  npm run verify ──► dist를 cheerio로 검사 (TESTING §4)
```

- 통합: `integrations: [markdoc(), ...(process.env.SKIP_KEYSTATIC ? [] : [react(), keystatic()])]`. React는 Keystatic 관리자 UI 전용이라 keystatic()과 함께 조건부 마운트한다 — react()를 프로덕션에 무조건 포함시키면(당초 안) 페이지에서 실제로 쓰지 않아도 `@astrojs/react`가 참조되지 않는 React 런타임 청크(~190KB)를 dist에 남기는 것을 T0에서 확인했다(빈 청크라 HTML에서 로드되진 않지만 verify의 "React 런타임 청크 부재" 항목과 상충). markdoc()만 무조건 포함(본문 렌더링에 필요). 개발 서버에선 관리자·API 라우트가 살아 있고, 프로덕션 빌드는 어댑터 없이 정적으로 떨어진다.
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

빌드 산출물(dist/)만 검사한다. 브라우저·네트워크 0, cheerio + fs.

검사 항목(전체 목록은 TESTING §4): 전 포스트 페이지 존재 / 내부 링크·앵커 무결성 / img alt 100% / h1 유일성·랜드마크 / OG·title·description 메타 / RSS 파싱·항목 수 = 공개 포스트 수 / sitemap URL 수 일치·draft 부재 / **dist에 keystatic 경로·React 런타임 부재** / 외부 origin 참조 0 / 페이지 HTML ≤ 예산(기본 100KB, 폰트 제외) / 404 페이지 존재.

## 6. 환경변수·스크립트

```
# .env.example
SKIP_KEYSTATIC=            # build 스크립트가 true로 설정. dev에선 비움
```

package.json scripts: `check`(astro check+lint+format:check+vitest --project unit), `build`(SKIP_KEYSTATIC=true astro build), `verify`(vitest run --project verify — dist 필요), `dev`(astro dev, SKIP_KEYSTATIC 비움), `preview`(**SKIP_KEYSTATIC=true astro preview** — keystatic()이 켜져 있으면 Keystatic의 API 라우트 때문에 `output`이 static이 아닌 server로 강제되고, 어댑터가 없어 preview가 "No adapter found"로 실패한다; preview는 어차피 `build`가 만든 정적 dist를 보는 용도라 build와 동일하게 SKIP_KEYSTATIC을 켠다).

## 7. 디렉터리 구조 (목표)

```
astro-test/
  CLAUDE.md  README.md  keystatic.config.ts  astro.config.mjs  .env.example
  docs/  public/fonts/  scripts/verify/
  src/{content,content.config.ts,layouts,components,pages,styles,lib}/
  tests/
```
