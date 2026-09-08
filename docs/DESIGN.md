# DESIGN — astro-test v0.1

This document is the source of truth for the implementation. Any change to the content model, routes, or verify rules starts by editing this document.

## 1. Architecture

```
[Local editing]     npm run dev ──► /keystatic (admin UI, React) ──► writes src/content/* files
                                                                     (storage: local — when no secrets)
[Deployed editing]  https://<domain>/keystatic ──► GitHub OAuth login ──► commits via the GitHub API
                                                   (storage: github — when secrets exist on Vercel)
[Consumption]       Astro content collections (content.config.ts, zod) ──► static page generation
[Deployment]        astro build (adapter: @astrojs/vercel) ──► dist/ = public pages (fully static)
                                                               + /keystatic·/api/keystatic (on-demand)
[Verification]      npm run verify ──► inspects only the static dist with cheerio (TESTING §4; on-demand routes are out of scope)
```

- Integrations: `integrations: [markdoc(), sitemap(), react(), keystatic()]` — all included unconditionally
  (before 2026-09-08 we stripped react() and keystatic() out of production via `SKIP_KEYSTATIC`, but that
  wiring was removed once we decided to expose `/keystatic` in production through GitHub mode). `adapter: vercel()`
  was added. `keystatic()` from `@keystatic/astro` injects the two routes `/keystatic/[...params]` and
  `/api/keystatic/[...params]` itself via `injectRoute(..., { prerender: false })`, so only those two become
  on-demand while every other page is untouched — the structure only requires leaving `output: 'static'`
  (the default) in place and adding an adapter (Astro's `hybridOutput` adapter feature). `storage` is switched
  automatically between local and github in `keystatic.config.ts` based on whether `KEYSTATIC_GITHUB_CLIENT_ID`
  is present — local development stays in local mode with no secrets.
- Keystatic writes the same files Astro reads — the parity test (bottom of §2) enforces that the two schemas stay in sync.

## 2. Content model (one truth behind two schemas)

### posts — `src/content/posts/*` (format: contentField=content, Markdoc)

| Field | Keystatic | Astro(zod) | Rules |
|---|---|---|---|
| title | fields.slug | string | slugField |
| excerpt | fields.text | string(≤200) | for lists and meta descriptions |
| pubDate | fields.date | coerce.date | sort key for reverse-chronological order |
| authors | fields.array(relationship→authors) | array(reference) | at least one |
| tags | fields.array(text) | array(string) | lowercase kebab (via the normalization function) |
| cover | fields.image(optional) + coverAlt(text) | string(optional)+string | **alt required when cover is present** (refine) |
| draft | fields.checkbox(default false) | boolean | excluded from production |
| content | fields.markdoc | body | the body |

**Why cover is a `string` rather than an `image()` (verified empirically in T1)**: Keystatic's `fields.image()` writes a public URL string derived from `publicPath` into the frontmatter (e.g. `/posts-images/<slug>/cover.png`) and stores the actual file under `directory` (a fixed path, with a per-slug subfolder created automatically) — that is not a path relative to the entry file, so it does not line up with Astro content collections' `image()`, which expects a colocated relative path processed by Vite. So we point the image directory at `public/posts-images` (making the public URL and the real location identical) and have zod accept that URL string as-is with `z.string().optional()` — we give up Vite image optimization (automatic width/height inference), but that is fine for an evaluation site.

### authors — `src/content/authors/*`

name(slug) · role(text) · bio(text ≤300). Seeded with three fictional people.

### settings — singleton `src/content/settings/site`

siteTitle · description · footerNote. Replacing the company name happens here, in one place.

**Parity test**: it introspects the set of collection and field keys in keystatic.config, along with whether each is required, and compares that against the shape of the zod schema in content.config. If a field is added, removed, or has its requiredness changed on only one side, the test fails — this is the drift gate for the dual schema.

## 3. Routing and data flow

- `src/lib/postFilters.ts`: `publishedPosts(all, {includeDrafts})` — sorting (newest first) and draft exclusion live in one place. Home, tags, RSS, and sitemap all go through this single function (one policy, one implementation).
- Pagination: Astro `paginate()`, 10 per page, `/page/N`.
- Tags: normalized by `tagSlug()` (lowercase, kebab-case, Unicode allowed) — link generation and route generation use the same function.
- Reading time: `readingTime(markdocSource)`, word count / 230wpm, a pure function.
- RSS: `@astrojs/rss` — built from publishedPosts, with excerpt as the description. Sitemap: `@astrojs/sitemap` defaults, with draft exclusion confirmed by verify.

## 4. Design tokens (src/styles/tokens.css)

```css
:root {
  --font-display: "Source Serif 4", serif;   /* self-hosted woff2, final choice made in T2 */
  --font-body: "Inter", system-ui, sans-serif;
  --color-ink: #121212; --color-paper: #ffffff;
  --color-accent: #2a3d8f;                    /* our own deep indigo — not a copy of the reference's color */
  --measure: 68ch; --space-1..-8: 4px scale; --step--1..-5: type scale (1.25 ratio);
}
```

Prose styles (prose.css): heading hierarchy, code blocks (a single Shiki theme), blockquotes, tables, image captions. Responsiveness comes from the container width plus one step down on the type scale (mobile).

## 5. Build verifier (scripts/verify/ — a vitest project)

It inspects only the **static prerender portion** of the build output (dist/). Zero browser, zero network; cheerio + fs.
Because `/keystatic` and `/api/keystatic` are `prerender: false`, they never land in dist as static files —
the adapter deploys them as separate serverless functions — so they are outside this suite's scope (this
remained true even after GitHub mode was introduced on 2026-09-08, which is why the checks below are still
valid without any code changes).

Checks (the full list is in TESTING §4): every post page exists / internal link and anchor integrity / 100% img alt coverage / a single h1 and correct landmarks / OG, title, and description meta / RSS parses and its item count = the number of public posts / sitemap URL count matches and contains no drafts / **no keystatic paths and no React runtime chunks in the static dist** (the adapter's serverless function output is separate — this check only asks whether the prerendered output is still purely static) / zero references to external origins / page HTML ≤ budget (100KB by default, excluding fonts) / a 404 page exists.

## 6. Environment variables and scripts

```
# .env.example — leave everything empty and local development runs on local storage (unchanged)
PUBLIC_KEYSTATIC_STORAGE=            # must be set to "github" to switch storage into GitHub mode
KEYSTATIC_GITHUB_CLIENT_ID=          # GitHub App
KEYSTATIC_GITHUB_CLIENT_SECRET=      # GitHub App
KEYSTATIC_SECRET=                    # random string for encrypting the session cookie (e.g. openssl rand -hex 32)
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=    # GitHub App slug (public, not a secret) — used to render the "install the app" link
```

Keystatic's GitHub mode requires a **GitHub App**, not a classic OAuth App. A classic OAuth App does not
work: login fails with "Authorization failed" unless token expiration is opted in, and even with that
enabled, saving fails with a GraphQL error reporting that the token has been granted `['']` scopes for
`createCommitOnBranch`.

The credentials come from Keystatic's built-in setup wizard: run the dev server with
`PUBLIC_KEYSTATIC_STORAGE=github` and open `/keystatic/setup`. It creates the GitHub App through GitHub's
App Manifest flow and writes the resulting values into a local `.env`. Creating the App is not enough — it
also has to be **installed** on the repository. `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` is not a secret; the
admin UI uses it to render an "install the app" link for users who lack write access. See
`docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md` for the full procedure and the catalogue of failure modes.

Why `PUBLIC_KEYSTATIC_STORAGE` carries the `PUBLIC_` prefix: `keystatic.config.ts` is bundled for the
browser as well as the server (the admin UI needs to know the schema on the client too), and Vite does not
inline variables into the client bundle unless they have the `PUBLIC_` prefix — reading `process.env`
directly produced a real crash with "process is not defined" (verified empirically). So the storage-kind
switch reads `import.meta.env.PUBLIC_KEYSTATIC_STORAGE` (a non-sensitive flag), while the two real secrets
are still read server-side only, through `getSecret()` from `astro:env/server`.

On Vercel production these are set as Environment Variables (a human issues the values — see
`docs/EVAL-KEYSTATIC.md` §7). The local `.env` may be left empty; fill it in and you can test GitHub mode
locally as well (verified empirically: with the values in place the "Log in with GitHub" screen appears —
actually logging in requires a real GitHub App).

package.json scripts: `check` (astro check + lint + format:check + vitest --project unit), `build` (astro build — with the adapter in place, only `/keystatic` and `/api/keystatic` are on-demand and everything else stays static), `verify` (vitest run --project verify — requires dist), `dev` (astro dev; local mode when there are no secrets), `preview` (**`vite preview --outDir dist/client`**, not `astro preview` — verified empirically: the `@astrojs/vercel` adapter does not support `astro preview` at all ("The @astrojs/vercel adapter does not support the preview command"), because a project with on-demand routes needs an adapter-specific approach. `vite preview` serves only the static files in `dist/client`, which is enough for a **visual review of the public pages** (TESTING §5) but cannot serve `/keystatic` — reproducing `/keystatic` locally with the adapter in the loop requires Vercel's `vercel dev` CLI, which needs its own login and project link and is not wired up in this project).

## 7. Directory structure (target)

```
astro-test/
  CLAUDE.md  README.md  keystatic.config.ts  astro.config.mjs  .env.example
  docs/  public/fonts/  scripts/verify/
  src/{content,content.config.ts,layouts,components,pages,styles,lib}/
  tests/
```
