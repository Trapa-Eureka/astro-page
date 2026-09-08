# CLAUDE.md — astro-test steering

A test site for evaluating Astro + Keystatic (the engineering blog of a fictional company, Makinilya Studio). The spec is `docs/SPEC.md`, the design is `docs/DESIGN.md`.

## Stack

- Astro latest stable (version pinned and recorded in T0), TypeScript **strict**
- Keystatic: `@keystatic/core` + `@keystatic/astro`, with storage switched by environment variable in `keystatic.config.ts` — local development uses local mode (writing files directly), production (Vercel) uses GitHub mode backed by a GitHub App (OAuth-based user login, GitHub App permissions). The admin UI (`/keystatic`) now exists in production too, but is protected by GitHub authentication (only accounts with write access to the repository can get in) — decided 2026-09-08, see `docs/EVAL-KEYSTATIC.md`. Setting this up has several non-obvious failure modes (a GitHub App is required, and it must be installed on the repo) — `docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md` catalogues all of them.
- Integrations: `@astrojs/react` (for the Keystatic admin) + `@astrojs/markdoc` (content) + `@astrojs/vercel` (adapter; only `/keystatic` and `/api/keystatic` are on-demand server-rendered) — the public content pages (home, posts, tags, about, 404, rss, sitemap) are still purely static prerendered output with no React islands
- Styling: hand-written CSS + design tokens (`src/styles/tokens.css`), self-hosted open fonts — no external CDNs or font services
- Extras: `@astrojs/rss`, `@astrojs/sitemap`; code highlighting uses Astro's built-in Shiki
- Verification: `astro check` + ESLint + Prettier + Vitest; dist inspection uses cheerio (no browser, no network)

## Commands

```bash
npm run check      # astro check + lint + format check + vitest — the mandatory gate for task completion
npm run test       # vitest run
npm run dev        # dev server (+ /keystatic, local mode)
npm run build      # astro build — public pages are static; only /keystatic and /api/keystatic are on-demand
npm run verify     # dist verification suite (TESTING §4) — run after a build
npm run preview    # local preview of the build output (for humans)
```

## Source layout

```
keystatic.config.ts        # editing schema (Keystatic)
src/
  content.config.ts        # consumption schema (Astro collections, zod) — kept in sync with keystatic via a parity test
  content/{posts,authors,settings}/   # content files Keystatic writes and Astro reads
  layouts/  components/    # BaseLayout, Header, Footer, PostCard, AuthorLine, Pagination
  pages/                   # index, posts/[slug], tags/[tag], about, rss.xml, 404
  styles/                  # tokens.css, base.css, prose.css
  lib/                     # readingTime, formatDate, tagSlug, postFilters (pure functions)
scripts/verify/            # dist inspection suite (run via vitest)
tests/                     # unit + parity
```

## Conventions

- The source of truth for the content model is `docs/DESIGN.md` §2. Both keystatic.config and content.config follow that table, and the parity test catches drift.
- `src/lib/` holds pure functions only — pull page frontmatter logic out into lib and unit-test it.
- Image fields require alt text (enforced by the schema). Semantic landmarks (header/main/footer) and exactly one h1 per page.
- No `any`; use zod at content boundaries. Error messages must state the cause plus how to fix it.
- Commit messages: `T{n}: summary`.

## Guardrails (never violate)

1. **No copying the reference**: do not put The Guardian's sentences, headlines, logo, proprietary typefaces (Guardian Egyptian/Headline, etc.), or icons anywhere in the code, content, or assets. Borrowing stops at the "layout grammar" list in SPEC §2.
2. **Content must be original fiction only**: no factual claims about real companies, people, or events. Authors, companies, and projects are all fictional, and technical explanations stay at the level of general knowledge.
3. **Public content pages must always stay fully static with 0 JS** (the pre-2026-09-08 guardrail "no /keystatic in production at all" was dropped at the user's request — `/keystatic` and `/api/keystatic` now exist in production too, but they are separate on-demand routes protected by GitHub authentication and fall outside the static `dist/` output that `scripts/verify/` inspects). Verify continues to enforce that home, posts, tags, about, 404, rss, and sitemap are still purely static.
4. A static site with 0 external requests: no third-party loading of fonts, scripts, analytics, or anything else. Verify checks dist for references to external URLs.
5. Zero network calls in tests and verify. dist inspection uses only the filesystem plus cheerio.
6. Do not delete or weaken items on the `npm run verify` checklist — the correct response to a failure is to fix the site.

## How to work

- One session = one task from `docs/TASKS.md`. Self-correct in a loop until every completion criterion is met and `npm run check` passes (including verify where applicable). Only ask questions when spec ambiguity blocks you.
- Visual judgments (spacing, type sizes, and the like) are implemented with the token defaults and left to human review — do not add libraries on your own initiative.

## Pruning log

Reviewed every two weeks; stale rules deleted (`docs/WORKFLOW.md`).

- 2026-09-06: initial version.
- 2026-09-08: guardrail 3 revised — with Keystatic GitHub mode, `/keystatic` now exists in production too (authentication-protected). The stack and commands sections were updated along with it.
