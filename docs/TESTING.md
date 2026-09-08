# TESTING — astro-test

목적: 정적 사이트의 "로컬 결정론 검증"을 두 층으로 세운다 — **단위(순수 함수·스키마 패리티)** 와 **빌드 산출물 검사(verify)**. 브라우저·네트워크 없이 dist만 검사해도 블로그 품질의 대부분(링크·메타·접근성 기본·정책 준수)이 기계 판정된다. 시각 품질만 사람 몫이다.

## 1. 원칙

- 테스트·verify에서 네트워크 호출 0건. dist는 파일시스템 + cheerio로만 검사.
- `npm run check` = astro check + lint + format check + vitest(단위·패리티). `npm run verify`는 빌드 후 별도 게이트 — T7부터 태스크 완료 기준에 포함된다.
- 시드 콘텐츠(자작 픽션)는 그 자체가 픽스처다 — draft 1편, 커버 있는 글/없는 글, 다저자 글, 태그 중복을 반드시 포함하도록 구성(엣지가 콘텐츠에 내장).

## 2. 단위 테스트 (tests/)

| 대상 | 케이스 |
|---|---|
| `readingTime` | 짧은 글/긴 글/코드블록 포함/0단어 → 최소 1분 |
| `formatDate` | 고정 날짜 → 고정 문자열(로케일 고정, 시스템 의존 금지) |
| `tagSlug` | 대소문자·공백·특수문자·유니코드 → 안정 슬러그, 멱등성 |
| `publishedPosts` | 정렬 최신순 / draft 제외 / includeDrafts 옵션 / 동일 날짜 안정 정렬 |
| cover/alt refine | cover 있고 alt 없음 → 스키마 에러(수정 방법 포함 메시지) |

## 3. 스키마 패리티 테스트 (드리프트 게이트)

- keystatic.config를 import해 컬렉션별 필드 키 집합·필수 여부를 추출 → content.config의 zod shape와 비교.
- 실패 조건: 한쪽에만 있는 필드, 필수성 불일치, 컬렉션 경로 불일치.
- 이 테스트가 있는 한 "Keystatic에서 필드 추가했는데 Astro가 모름" 류의 사고는 빌드 전에 잡힌다 — Keystatic 평가 메모의 핵심 관찰 지점이기도 하다.

## 4. verify 체크리스트 (scripts/verify/ — dist 검사, 삭제·완화 금지)

이 체크리스트는 **정적 프리렌더 산출물**(dist/)만 본다. `/keystatic`·`/api/keystatic`은
2026-09-08부터 GitHub 모드로 프로덕션에도 존재하지만 `prerender: false`라 dist에 정적
파일로 안 떨어지고 어댑터가 별도 서버리스 함수로 배포한다 — 그래서 이 스위트의 범위 밖이고,
아래 항목들은 코드 수정 없이 계속 유효하다(`docs/DESIGN.md` §1·§5).

**존재·무결성**
- [ ] 공개 포스트 수 = `/posts/*/index.html` 수, 각 페이지에 h1 정확히 1개
- [ ] 모든 내부 링크(`/`로 시작)가 dist 내 실제 파일로 해석됨(앵커 포함), 404 없음
- [ ] `/404.html` 존재, 홈·최신 글 링크 포함
- [ ] 페이지네이션: 총 페이지 수 = ceil(공개 포스트/10), page/1 중복 없음

**메타·구독**
- [ ] 전 페이지 title·meta description·OG(title/type/url) 존재
- [ ] rss.xml 파싱 성공, item 수 = 공개 포스트 수, draft 슬러그 부재
- [ ] sitemap URL 수 일치, draft·/keystatic 부재

**정책·접근성 기본**
- [ ] `<img>` alt 100% (빈 문자열은 장식 이미지 표시가 있을 때만)
- [ ] header/main/footer 랜드마크 존재, 스킵 링크 존재
- [ ] 외부 origin 참조 0 (href/src/preload 전수 스캔 — 폰트·스크립트 자급)
- [ ] **정적 dist에 keystatic 경로·React 런타임 청크 부재** (프리렌더 산출물이 여전히 순수 정적인지 증명 — `/keystatic` 자체의 존재 여부는 이 검사 범위 밖, 위 안내 참고)
- [ ] 페이지 HTML ≤ 100KB(폰트 제외), 초과 시 목록 출력

**콘텐츠 정책**
- [ ] 금지 문자열 스캔: "theguardian", "Guardian Egyptian" 등 레퍼런스 흔적이 dist·src 콘텐츠에 없음

## 5. 사람 스모크 (T10)

1. `npm run dev` → `/keystatic` 접속 → 포스트 1편 신규 작성(커버 포함) → `src/content/posts/`에 파일 생성 확인
2. draft 토글 동작 확인 → `npm run build && npm run verify` → 새 글 반영·draft 제외 확인
3. `npm run preview`로 시각 리뷰(서체·간격·모바일 폭) → 조정 사항은 tokens.css 값으로만
4. 관찰을 `docs/EVAL-KEYSTATIC.md`에 기록(편집 UX·스키마 표현력·거슬린 점)

## 6. 판정

- 태스크 공통: `npm run check` 통과. T7 이후: `npm run verify` 전 항목 그린 포함.
- 커버리지 수치보다 verify 그린이 이 레포의 완료 신호다.
