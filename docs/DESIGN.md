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

- 통합: `integrations: [react(), markdoc(), ...(process.env.SKIP_KEYSTATIC ? [] : [keystatic()])]` — Keystatic 공식 "프로덕션에서 관리자 UI 비활성화" 레시피. 개발 서버에선 관리자·API 라우트가 살아 있고, 프로덕션 빌드는 어댑터 없이 정적으로 떨어진다.
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
| cover | fields.image(옵션) + coverAlt(text) | image()+string | **cover 있으면 alt 필수** (refine) |
| draft | fields.checkbox(기본 false) | boolean | 프로덕션 제외 |
| content | fields.markdoc | body | 본문 |

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

package.json scripts: `check`(astro check+lint+format:check+vitest), `build`(SKIP_KEYSTATIC=true astro build), `verify`(vitest --project verify — dist 필요), `dev`, `preview`.

## 7. 디렉터리 구조 (목표)

```
astro-test/
  CLAUDE.md  README.md  keystatic.config.ts  astro.config.mjs  .env.example
  docs/  public/fonts/  scripts/verify/
  src/{content,content.config.ts,layouts,components,pages,styles,lib}/
  tests/
```
