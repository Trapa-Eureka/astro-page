# SPEC — astro-test v0.1

Written: 2026-09-06 · Status: final (change this document first, then the code)

## 1. Purpose

This project is a **test site** that validates two things:

1. **Evaluating Keystatic** — as a git-based file CMS, is its editing experience, schema expressiveness, and fit with Astro good enough to make it a candidate CMS for a real content product? The deliverable is a "Keystatic evaluation memo" summarizing the pros and cons (T10).
2. **Producing an editorial blog template** — an Astro static-site skeleton (content model and verification suite included) that can be reused for real blogs and content sites later.

Site identity: "Makinilya Engineering", the technical blog of the fictional web development company **Makinilya Studio**. The company, authors, and projects are all fiction, and the names are placeholders.

## 2. Scope of what is borrowed from the reference (theguardian.engineering)

**What we borrow — at the level of layout grammar:**
- Editorial hierarchy: large serif headlines over restrained body copy, generous line height and whitespace
- Home = a reverse-chronological article list (title, author, date, one-line excerpt) with minimal ornament
- Article page = a single prose column (readable measure ~68ch), clear metadata (author, date, reading time), code block and blockquote styling
- A restrained palette: one ink-family accent color on a white paper background, minimal header and footer

**What is forbidden (same as guardrail 1):**
- Any Guardian sentence, headline, or body text; their logos and icons; their proprietary typefaces (Guardian Egyptian/Headline, etc.); exact reproductions of their brand colors; use of screenshot assets

**Our alternatives:** typefaces are self-hosted open fonts — Source Serif 4 (or Newsreader) for headlines, Inter for body and UI. The accent color is defined as our own token (a deep indigo).

## 3. Page and feature scope (v0.1)

| Route | Contents |
|---|---|
| `/` | Reverse-chronological post list, 10 per page + pagination (`/page/2`) |
| `/posts/[slug]` | Article — title, author(s), date, reading time, body (Markdoc), tag links |
| `/tags/[tag]` | Post list for that tag |
| `/about` | Introduction to the fictional company (in an explicitly fictional tone) + the three authors |
| `/rss.xml`, `/sitemap-*.xml` | Subscription and indexing (drafts excluded) |
| `/404` | Links to home and recent posts |
| `/keystatic` | **Development only** admin UI — excluded from production builds |

Feature rules: posts with draft=true are excluded from the production build, RSS, and sitemap (they remain visible on the dev server). Reading time is a pure function based on word count. Alt text is mandatory on every image. Dark mode is a non-goal.

## 4. Content (all original)

- 6–8 posts on web development topics from the fictional company (e.g. "What we learned bolting a CMS onto a static site", "Rebranding in a day with design tokens", "Six months of a build verification suite standing in for QA"). The technical content is original writing at the level of general knowledge — no factual claims about real organizations or people.
- Three fictional authors: name, role, short bio. 6–10 tags.
- Language: English by default (so the template can be reused globally). Bilingual Korean text is a non-goal.

## 5. Non-goals for v0.1

- Search, comments, dark mode, newsletter, internationalization (i18n)
- Using React islands (on public pages only — the admin UI was always React), external services (font CDNs, analytics)
- Automated production deployment — only a **written deployment procedure** for Vercel (T10); running it is a human decision (2026-09-08: the deploy target changed from Cloudflare Pages to Vercel)

> **2026-09-08 scope expansion**: "Keystatic's GitHub mode is a non-goal (evaluate local mode only)" was
> actually implemented at the user's request — editing directly from the deployed site turned out to be
> necessary. See §8. That decision also broke the original premise behind the "automated production
> deployment" line above (that a static site needs no adapter): the public pages are still static, but we
> added the `@astrojs/vercel` adapter so the two routes `/keystatic` and `/api/keystatic` can run
> on-demand.

## 6. Success criteria (how we decide v0.1 is done)

- `npm run check` passes and every item in `npm run verify` is green (TESTING §4 — link integrity, RSS/sitemap, alt text, size budget, zero external requests). verify inspects only the static `dist/` output; `/keystatic` and `/api/keystatic` (on-demand, §8) are outside its scope.
- The schema parity test passes (zero drift between keystatic.config and content.config).
- **Human smoke test**: `npm run dev` → write a brand-new post in /keystatic → confirm the file is created → confirm it shows up in the build.
- The Keystatic evaluation memo (docs/EVAL-KEYSTATIC.md) is written — editing UX, schema expressiveness, limitations, and a verdict on adopting it for a real product.

## 8. Keystatic GitHub mode (added 2026-09-08)

Editing content directly from the deployed site (Vercel) is impossible with static hosting alone — GitHub
login and GitHub API calls have to be handled on a server at request time. `keystatic.config.ts` switches
automatically between local and GitHub storage based on an environment variable (whether
`KEYSTATIC_GITHUB_CLIENT_ID` is present), and the `@astrojs/vercel` adapter serves just the two routes
`/keystatic` and `/api/keystatic` on-demand. Every other page remains a static prerender. Security: the
repository is private, so only GitHub accounts with write access can log in and save. For the procedure and
the env var values, see `docs/EVAL-KEYSTATIC.md` §7 and §8.

## 7. Open questions

- [ ] Whether to keep the company name Makinilya Studio (it's a placeholder — replacing it means editing the settings singleton in one place)
- [ ] Final choice of headline typeface (Source Serif 4 vs Newsreader) — to be decided in the T2 visual review
- [ ] Whether the default page size budget of 100KB (excluding fonts) is the right number — adjust once verify is in place
