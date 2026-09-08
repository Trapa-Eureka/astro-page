# scripts/verify/

Build-output (`dist/`) inspection suite (`docs/TESTING.md` §4, `docs/DESIGN.md` §5). Run with
`npm run verify` after `npm run build`. Checks run with cheerio + fs only — no browser, no network.

- `helpers.ts` — shared utilities: listing dist files, path conversion, internal link resolution,
  draft slug detection.
- `existence.test.ts` — post pages and h1 uniqueness, internal link/anchor integrity, 404,
  pagination arithmetic.
- `metaSubscription.test.ts` — title/description/OG on every page, rss.xml, sitemap.
- `policyA11y.test.ts` — img alt, landmarks and skip link, zero external-origin references, absence
  of keystatic and JS at runtime, page size budget.
- `contentPolicy.test.ts` — scan for forbidden reference-site strings (dist + src/content).

Do not delete or weaken checklist items (`CLAUDE.md` guardrail 6) — the right response to a failure
is to fix the site.
