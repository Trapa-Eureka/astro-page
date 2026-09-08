# TASKS — astro-test v0.1 backlog

## How to use

- One agent session = one task. Prompt template:
  > Read `docs/SPEC.md`, `docs/DESIGN.md`, and `docs/TESTING.md`, then carry out **T3**. Keep fixing your own work until every acceptance criterion is met and `npm run check` (including verify from T7 onward) passes. When you're done, summarize the changed files and the verification results.
- On completion, set the status to `DONE(date)` and commit (`T{n}: summary`).
- Parallel lanes: once T2 is done, **A (T3), B (T4), C (T5), D (T6)** can run concurrently in separate worktree agents.

Dependency graph: `T0 → T1 → T2 → {A: T3, B: T4, C: T5, D: T6} → T7 → T8 → T9 → T10`

---

### T0 — Scaffolding + integration wiring · Status: DONE(2026-09-07)
- Goal: Create the project on the latest stable Astro (record the version in the README status section), TS strict, react/markdoc/keystatic integrations with a conditional `SKIP_KEYSTATIC` mount, ESLint/Prettier/Vitest, the full set of scripts (check/dev/build/verify/preview), `.env.example`, `.gitignore`.
- Acceptance criteria: [ ] `npm run check` passes [ ] `/keystatic` responds in dev [ ] `npm run build` succeeds and dist has no keystatic paths (verified manually for now) [ ] git init + first commit

### T1 — Content model + seed · Status: DONE(2026-09-07) · Depends on: T0
- Goal: keystatic.config.ts (3 collections, exactly the DESIGN §2 table) + content.config.ts (zod, cover/alt refine) + a **parity test** + seed content (original fiction: 7 posts — 1 draft, 1 multi-author, a mix of with/without cover; 3 authors; settings).
- Acceptance criteria: [ ] Parity test passes (including a negative case confirming that dropping a single field makes it fail) [ ] cover/alt refine test [ ] Zero traces of the reference site in the content (confirmed original) [ ] check passes

### T2 — Design tokens + base layout · Status: DONE(2026-09-07) · Depends on: T1
- Goal: tokens.css (§4), base.css, prose.css; self-hosted open-license woff2 fonts (public/fonts); BaseLayout (landmarks, skip link, meta slots); Header/Footer (using the settings singleton).
- Acceptance criteria: [ ] Zero external origin references [ ] Landmarks and skip link present (unit render test or a dev check script) [ ] check passes

### T3 (lane A) — Home list + pagination · Status: DONE(2026-09-07) · Depends on: T2
- Goal: `/` list in reverse-chronological order (PostCard: title, author, date, excerpt), `paginate()` at 10 per page, `/page/N`.
- Acceptance criteria: [ ] Goes through publishedPosts (no direct sorting) [ ] Unit test for the page-count formula [ ] check passes

### T4 (lane B) — Post detail · Status: DONE(2026-09-07) · Depends on: T2
- Goal: `/posts/[slug]` — metadata (authors, date, reading time), Markdoc rendering, Shiki code blocks, tag links, prose styling applied.
- Acceptance criteria: [ ] Uses the readingTime and formatDate libs [ ] Layout holds up for posts with no cover [ ] check passes

### T5 (lane C) — Tags, about, 404 · Status: DONE(2026-09-07) · Depends on: T2
- Goal: `/tags/[tag]` (shared tagSlug normalization), `/about` (fictional company, 3 authors), `/404`.
- Acceptance criteria: [ ] The tag route and the tag links use the same function (test for mismatch) [ ] check passes

### T6 (lane D) — RSS, sitemap, SEO · Status: DONE(2026-09-07) · Depends on: T2
- Goal: rss.xml (@astrojs/rss), sitemap integration, per-page title/description/OG slots filled in.
- Acceptance criteria: [ ] RSS goes through publishedPosts [ ] A missing meta slot is a type error (required prop) [ ] check passes

### T7 — Build verifier · Status: DONE(2026-09-07) · Depends on: T3–T6
- Goal: A `scripts/verify/` vitest project — every item on the TESTING §4 checklist implemented, plus `npm run verify`.
- Acceptance criteria: [ ] **Every §4 item green** [ ] Negative check: deliberately break something (e.g. one link) and confirm exactly that item fails [ ] check passes

### T8 — Policy hardening · Status: DONE(2026-09-07) · Depends on: T7
- Goal: Re-confirm draft exclusion on every path, tighten the checks for absent keystatic/React runtime in dist, scan for forbidden strings, report the size budget.
- Acceptance criteria: [ ] Every verify policy item green [ ] check passes

### T9 — Final integration · Status: DONE(2026-09-08) · Depends on: T8
- Goal: Polish the seed content (excerpts, tag cleanup), zero console warnings, refresh the README quickstart with the real commands.
- Acceptance criteria: [ ] check and verify all green [ ] `npm run preview` confirmed to start

### T10 — Human smoke test + evaluation memo · Status: DONE(2026-09-08, visual review pending human sign-off) · Depends on: T9
- Goal: The TESTING §5 smoke test (edit in Keystatic → confirm it lands in the build), write `docs/EVAL-KEYSTATIC.md` (editing UX, schema expressiveness, cost of maintaining parity, verdict on production adoption), document the Vercel deploy procedure (actually running it is optional).
- Acceptance criteria: [ ] A record of the smoke checklist being carried out [ ] Evaluation memo complete [ ] Deploy procedure in 5 lines or fewer

---

## Backlog on hold (do not start — outside the scope of this test project)

- Search / dark mode / i18n / Keystatic GitHub mode / deploy automation — for the production repo, if the evaluation comes out positive
