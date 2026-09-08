# TESTING — astro-test

Goal: build "local deterministic verification" for a static site in two layers — **unit tests (pure functions, schema parity)** and **build output checks (verify)**. Even with no browser and no network, inspecting dist alone gets most of what makes a blog good (links, metadata, accessibility basics, policy compliance) under machine judgment. Only visual quality is left to humans.

## 1. Principles

- Zero network calls in tests and verify. dist is inspected with the filesystem + cheerio only.
- `npm run check` = astro check + lint + format check + vitest (unit and parity). `npm run verify` is a separate post-build gate — from T7 onward it is part of the acceptance criteria for a task.
- The seed content (original fiction) is itself the fixture — compose it so that it necessarily includes 1 draft, posts with and without a cover, a multi-author post, and duplicate tags (edge cases baked into the content).

## 2. Unit tests (tests/)

| Target | Cases |
|---|---|
| `readingTime` | short post / long post / with code blocks / 0 words → minimum 1 minute |
| `formatDate` | fixed date → fixed string (locale pinned, no system dependence) |
| `tagSlug` | case, whitespace, special characters, Unicode → stable slug, idempotent |
| `publishedPosts` | reverse-chronological sort / drafts excluded / includeDrafts option / stable sort for identical dates |
| cover/alt refine | cover present, alt missing → schema error (message includes how to fix it) |

## 3. Schema parity test (drift gate)

- Import keystatic.config, extract the set of field keys and their required flags per collection, and compare against the zod shape in content.config.
- Failure conditions: a field present on only one side, a mismatch in whether a field is required, a mismatch in collection path.
- As long as this test exists, mistakes of the "added a field in Keystatic but Astro doesn't know about it" variety get caught before the build — which is also the key thing to observe for the Keystatic evaluation memo.

## 4. verify checklist (scripts/verify/ — dist checks; do not delete or relax)

This checklist looks only at the **static prerender output** (dist/). Since 2026-09-08 `/keystatic` and
`/api/keystatic` also exist in production via GitHub mode, but they are `prerender: false`, so they never
land in dist as static files — the adapter deploys them as separate serverless functions. That puts them
outside this suite's scope, and the items below remain valid with no code changes (`docs/DESIGN.md` §1, §5).

**Existence and integrity**
- [ ] Number of public posts = number of `/posts/*/index.html` files, exactly one h1 per page
- [ ] Every internal link (starting with `/`) resolves to a real file in dist (anchors included), no 404s
- [ ] `/404.html` exists and links to the home page and the latest posts
- [ ] Pagination: total page count = ceil(public posts / 10), no duplicate page/1

**Metadata and feeds**
- [ ] Every page has a title, meta description, and OG tags (title/type/url)
- [ ] rss.xml parses, item count = number of public posts, no draft slugs
- [ ] Sitemap URL count matches, no drafts and no /keystatic

**Policy and accessibility basics**
- [ ] Every `<img>` has alt (empty string only where the image is marked decorative)
- [ ] header/main/footer landmarks present, skip link present
- [ ] Zero external origin references (exhaustive scan of href/src/preload — fonts and scripts self-hosted)
- [ ] **No keystatic paths and no React runtime chunks in the static dist** (proving the prerender output is still purely static — whether `/keystatic` itself exists is outside this check's scope; see the note above)
- [ ] Page HTML ≤ 100KB (excluding fonts); print the list of offenders when exceeded

**Content policy**
- [ ] Forbidden-string scan: no traces of the reference site such as "theguardian" or "Guardian Egyptian" in dist or src content

## 5. Human smoke test (T10)

1. `npm run dev` → open `/keystatic` → write one new post (with a cover) → confirm a file is created under `src/content/posts/`
2. Confirm the draft toggle works → `npm run build && npm run verify` → confirm the new post shows up and the draft is excluded
3. Visual review via `npm run preview` (typography, spacing, mobile width) → make any adjustments via tokens.css values only
4. Record the observations in `docs/EVAL-KEYSTATIC.md` (editing UX, schema expressiveness, anything that grated)

## 6. Verdict

- Common to every task: `npm run check` passes. From T7 onward: plus every `npm run verify` item green.
- Green verify, not a coverage number, is this repo's signal that work is done.
