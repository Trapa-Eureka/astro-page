# scripts/verify/

빌드 산출물(`dist/`) 검사 스위트 (`docs/TESTING.md` §4, `docs/DESIGN.md` §5). `npm run build` 후
`npm run verify`로 실행. T7부터 채워진다 — 브라우저·네트워크 없이 cheerio + fs로만 검사.
