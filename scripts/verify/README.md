# scripts/verify/

빌드 산출물(`dist/`) 검사 스위트 (`docs/TESTING.md` §4, `docs/DESIGN.md` §5). `npm run build` 후
`npm run verify`로 실행. 브라우저·네트워크 없이 cheerio + fs로만 검사.

- `helpers.ts` — dist 파일 나열·경로 변환·내부 링크 해석·draft 슬러그 탐지 등 공용 유틸.
- `existence.test.ts` — 포스트 페이지·h1 유일성, 내부 링크·앵커 무결성, 404, 페이지네이션 산식.
- `metaSubscription.test.ts` — 전 페이지 title/description/OG, rss.xml, sitemap.
- `policyA11y.test.ts` — img alt, 랜드마크·스킵 링크, 외부 origin 참조 0, keystatic·JS 런타임 부재,
  페이지 용량 예산.
- `contentPolicy.test.ts` — 레퍼런스 사이트 문자열 금지 스캔(dist + src/content).

체크리스트 항목 삭제·완화 금지(`CLAUDE.md` 가드레일 6) — 실패의 올바른 대응은 사이트 수정이다.
