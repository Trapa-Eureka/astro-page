# Keystatic 평가 메모

작성: 2026-09-08 (T10) · 이 프로젝트의 진짜 목적(SPEC §1)에 대한 결과물.

## 0. 요약

Keystatic은 이 규모(포스트/저자/설정 3개 컬렉션, 로컬 git 스토리지, 에디터 소수)의 콘텐츠
모델에는 잘 맞았다. 실제로 걸린 마찰은 세 가지 — **이미지 필드가 Astro의 `image()` 헬퍼와
안 맞음**, **필드 간 조건부 필수(cover→coverAlt) 를 스키마 레벨에서 표현할 수 없음**,
**삭제 시 첨부 이미지가 안 지워짐** — 전부 우회 가능했고, 하나도 "이 방식으로는 못 만든다"
수준은 아니었다. 다만 이 셋 다 T0~T9를 진행하면서 **실제로 부딪혀서** 찾아낸 문제들이라,
Keystatic 문서만 읽고는 예상하기 어려운 종류의 비용이었다는 점은 기록해둘 만하다.

**실서비스 채택 판단은 아래 §5에 초안으로 남기고, 최종 결정은 사람(Jin) 몫이다**
(`docs/WORKFLOW.md` §4).

## 1. 사람 스모크 체크리스트 (TESTING.md §5)

| # | 항목 | 결과 |
|---|---|---|
| 1 | `npm run dev` → `/keystatic` → 포스트 1편 신규 작성(커버 포함) → `src/content/posts/`에 파일 생성 확인 | ✅ 완료 — 아래 §1.1 |
| 2 | draft 토글 동작 확인 → `npm run build && npm run verify` → 새 글 반영·draft 제외 확인 | ✅ 완료 — 아래 §1.2 |
| 2+ | (스펙엔 없지만 CRUD 전체를 확인하려고 추가) 삭제 동작 확인 | ✅ 완료 — 아래 §1.3, 첨부 이미지 잔존 발견 |
| 3 | `npm run preview`로 시각 리뷰(서체·간격·모바일 폭) → 조정은 tokens.css 값으로만 | ⏳ **사람 몫** — 아래 §1.4 |
| 4 | 관찰을 이 문서에 기록 | ✅ 이 문서 |

### 1.1 신규 작성

`/keystatic/collection/posts/create`에서 "T10 Smoke Test Post"를 제목·발췌·날짜·저자
(Priya Castellanos)·태그(smoke-test)·커버 이미지+alt·본문까지 채우고 Create 클릭 →
즉시 `src/content/posts/t10-smoke-test-post.mdoc`(프런트매터 + Markdoc 본문)와
`public/posts-images/t10-smoke-test-post/cover.png`가 파일시스템에 생성됨을 확인.
슬러그는 제목에서 자동 생성(직접 수정도 가능).

### 1.2 draft 토글 + 빌드 반영

Draft 체크 → Save → `t10-smoke-test-post.mdoc`의 `draft: true` 확인 → `npm run build` →
해당 포스트 페이지·태그 페이지 둘 다 dist에 없음(19페이지 그대로) → `npm run verify` 80/80
그린. Draft 해제 → Save → `draft: false` 확인 → 재빌드 → 포스트 페이지 + 새 태그 페이지
(`/tags/smoke-test/`) 둘 다 생성(21페이지) → `npm run verify` 86/86 그린. **draft 제외
정책이 CMS 조작 → 빌드까지 정확히 살아있음을 실측으로 확인.**

### 1.3 삭제

우측 상단 휴지통 아이콘 → "Are you sure? This action cannot be undone." 확인 다이얼로그 →
Yes, delete → `t10-smoke-test-post.mdoc` 즉시 삭제 확인. **단, `public/posts-images/
t10-smoke-test-post/`에 업로드했던 커버 이미지 디렉터리는 삭제 후에도 남아있었다** — 수동
정리 필요(§2.3에 상세). 테스트 후 직접 정리하고 재빌드/verify로 19페이지·80/80 원상복구
확인.

### 1.4 시각 리뷰 — 사람 확인 필요

T0~T9 작업 중 스크린샷으로 여러 페이지(홈·포스트 상세·태그·about·404)를 이미 봤고 육안상
크게 튀는 곳은 없었지만, 이건 기능 확인 과정에서 곁다리로 본 것이지 WORKFLOW.md §4가 못
박은 "시각 리뷰·서체 최종안·토큰 값 확정" 그 자체는 아니다. `npm run preview`로 직접
열어서 서체(Source Serif 4 vs Newsreader — SPEC §7 미결 사항), 간격, 모바일 폭을
확인해주세요. 조정이 필요하면 `src/styles/tokens.css`의 값만 바꾸는 것으로 충분하다 —
컴포넌트 구조는 이미 토큰을 참조하도록 되어 있음.

## 2. 편집 UX

**잘 되는 것**
- 제목 입력 시 슬러그 자동 생성(수정 가능), relationship 필드(저자)는 검색 가능한
  콤보박스로 선택 — 오타로 잘못된 슬러그를 참조할 여지가 거의 없음.
- Markdoc 본문 편집기는 툴바 있는 split-pane WYSIWYG-ish 에디터 — 헤딩·리스트·코드블록·
  이미지 삽입 버튼 제공.
- 이미지 업로드는 파일 선택 → 즉시 미리보기, 별도 저장 없이 엔트리 저장 시 함께 커밋됨.
- 삭제에 확인 다이얼로그가 있음(§1.3) — 실수 방지.

**거슬린 점**
- 폼이 "Add"(관계/배열 필드) 클릭으로 split-pane 콘텐츠 에디터 레이아웃으로 전환될 때
  사이드바 필드들의 화면 좌표가 크게 바뀐다. 자동화 클릭(이 세션)에서 이 때문에 몇 번
  헛클릭이 났는데, 사람이 직접 쓸 때도 "방금까지 여기 있던 필드가 갑자기 옮겨감" 정도의
  위화감은 있을 수 있다 — 큰 문제는 아니지만 첫 사용 경험에 낄 수 있는 디테일.
- cover 이미지가 설정됐는데 coverAlt를 안 채워도 Keystatic 폼 자체는 저장을 막지 않는다
  (§2.2 참고) — 에디터 입장에서는 "저장은 됐는데 나중에 빌드가 실패한다"는 걸 겪게 됨.
- 삭제가 첨부 이미지를 안 지운다(§2.3) — 반복되면 `public/posts-images/`에 고아 디렉터리가
  쌓인다.

## 3. 스키마 표현력

- 우리가 쓴 필드 종류(slug, text+길이제약, date, checkbox, image, array-of-text,
  array-of-relationship, markdoc)는 전부 무리 없이 표현됐다.
- **이미지 필드의 진짜 동작(실측)**: `fields.image({ directory, publicPath })`는
  프런트매터에 **`publicPath` 기반 공개 URL 문자열**을 쓴다(예:
  `/posts-images/<slug>/cover.png`) — 엔트리 파일 기준 상대경로가 아니다. Astro
  콘텐츠 컬렉션의 `image()` zod 헬퍼는 Vite가 처리하는 콜로케이션 상대경로를
  기대하므로 이 둘은 그대로 못 붙는다. `directory`를 `public/`로 두고 zod에서
  `z.string()`으로 받는 우회로 해결했다(`docs/DESIGN.md` §2) — 동작은 하지만 Vite의
  자동 이미지 최적화(반응형 크기, 포맷 변환, width/height 추론)는 못 쓴다. 이미지가
  많은 사이트로 갈수록 이 손실이 누적된다.
- **조건부 필수를 스키마에서 표현할 수 없다**: "cover가 있으면 coverAlt 필수"는
  Keystatic 필드 옵션으로 직접 표현이 안 돼서 Astro 쪽 zod `.refine()`에만 존재한다.
  즉 Keystatic 에디터 화면에서는 이 규칙이 전혀 안 보이고, 위반해도 저장 시점엔 안 잡힌다
  (`npm run build`/`verify` 시점에야 잡힘). 접근성이 중요한 프로젝트에서 alt 텍스트
  강제를 CMS 레벨에서 못 건다는 건 실서비스에서는 꽤 아쉬운 지점.
- 그 외 텍스트 길이 제약(`validation.length.min/max`), 필수 여부(`isRequired`), 배열
  최소 개수(`array` 필드의 `validation.length.min`)는 전부 예상대로 동작했다.

## 4. 패리티 유지 비용

- 콘텐츠 모델이 `keystatic.config.ts`(에디팅)와 `src/content.config.ts`(zod, 소비)
  두 곳에 따로 존재 — 필드 하나를 고치려면 최소 두 파일을 함께 고쳐야 한다.
- `tests/content-parity.test.ts`(T1)가 필드 키 집합·필수 여부 드리프트를 자동으로 잡아준다
  — 이건 확실히 값어치를 한다(실제로 T1 작업 중 필드 하나를 일부러 지워서 정말 잡히는지
  검증함).
- 다만 이 테스트를 **만드는** 비용은 예상보다 컸다. `keystatic.config.ts`가 실행 시점에
  노출하는 필드 객체의 내부 구조(`kind`/`formKind`)가 필드 종류를 안정적으로 구분해주지
  않았다(실측: 일반 `fields.text()`조차 `formKind: 'slug'`를 반환) — 그래서 "설정을
  단순히 introspect"하는 대신 각 필드의 공개 API인 `validate()`를 실제로 호출해서
  필수 여부를 판정하는 우회 로직을 짜야 했다. `docs/DESIGN.md`가 원래 가정한 "keystatic.
  config를 import해 필드 키 집합·필수 여부를 introspect"는 필드 키 집합 쪽은 쉬웠지만
  필수 여부 쪽은 실제로 더 깊이 파고들어야 했다.
- `src/content.config.ts`가 `astro:content` 가상 모듈(Astro의 Vite 파이프라인 밖에서는
  resolve 안 됨)에 의존해서, zod 셰이프를 `src/content.schemas.ts`로 따로 빼야 순수
  Vitest에서 패리티 테스트를 돌릴 수 있었다 — 사소하지만 "왜 파일이 나뉘어 있는지" 처음
  보는 사람에게 설명이 필요한 간접 구조 하나가 늘었다.

## 5. 실서비스 채택 판단 (초안 — 최종 결정은 Jin)

**조건부 권장**: 이 프로젝트 규모(콘텐츠 모델 단순, 에디터 소수, git 기반 로컬 스토리지로
충분)에서는 Keystatic을 실서비스로 써도 괜찮다고 본다. 위에서 찾은 마찰들은 전부 설계
단계에서 한 번 우회하면 끝나는 종류지, 운영 중에 반복적으로 사람을 괴롭히는 종류는 아니다.

다만 아래 조건 중 하나라도 해당되면 채택 전에 다시 검토하는 걸 권한다:
- **이미지가 많고 반응형 최적화가 중요한 사이트** — image() 헬퍼 미지원으로 인한
  최적화 손실이 누적됨.
- **비개발자 에디터가 다수이고 접근성(alt 텍스트) 강제가 중요** — 조건부 필수를
  CMS 레벨에서 못 걸어서, 운영 규율(리뷰 프로세스)로 메꿔야 함.
- **콘텐츠 모델이 앞으로 자주, 크게 바뀔 예정** — 패리티 테스트가 있어도 이중 스키마
  유지 자체의 반복 비용은 남는다.

이 프로젝트(가상의 소규모 에디토리얼 블로그) 스코프에서는 셋 다 해당 없음 — 그래서
조건부가 아니라 그냥 "권장"에 가깝지만, 최종 채택 여부·GitHub 모드 전환 여부는 명시적으로
사람이 판단할 몫으로 남긴다.

## 6. Keystatic GitHub 모드 소감 (SPEC §5 — local 모드만 평가, 참고용)

GitHub 모드는 이번 프로젝트에서 실제로 써보지 않았다(SPEC 비목표). local 모드의 동작
(파일 즉시 쓰기, git 커밋은 사람/CI 몫)으로 미루어 보면 GitHub 모드는 "저장 = 커밋
(또는 PR)"으로 바뀌는 구조라 추측되는데, 이건 문서만 읽고 하는 추정이라 실측 근거가
없다 — 실서비스에서 GitHub 모드가 필요해지면 별도로 검증이 필요하다.

## 7. 배포 절차 (Vercel)

실행은 사람 선택(`docs/WORKFLOW.md` §4) — 아래는 절차 문서일 뿐, 이 세션에서 실행하지
않았다.

1. Vercel 대시보드 → New Project → GitHub 리포(`Trapa-Eureka/astro-page`) 연결(private도 가능).
2. Framework Preset: Astro 자동 감지. Build Command `npm run build`, Output Directory `dist`, Install Command `npm install`.
3. 환경변수 불필요 — `SKIP_KEYSTATIC`은 `build` 스크립트 안에서 자체 설정됨.
4. Deploy → 빌드 로그에서 dist에 `/keystatic` 경로 없음(정적 사이트) 확인.
5. 도메인 확정되면 `astro.config.mjs`의 placeholder `site` 값을 실제 도메인으로 바꾸고 재배포.
