# Keystatic evaluation memo

Written 2026-09-08 (T10; the GitHub mode sections added 2026-09-08) · This is the deliverable for the real purpose of this project (SPEC §1).

> §1–§5 are based on local mode (as of the T10 smoke test); §6–§7 were added afterwards when
> we extended the project to GitHub mode (SPEC §8). The conclusions about local mode remain
> valid as written — in GitHub mode, local development still falls back to local mode when no
> secrets are provided.

## 0. Summary

Keystatic fit the content model at this scale well (three collections — posts, authors, settings — local git storage, a handful of editors). Three points of friction actually bit us — **the image field does not line up with Astro's `image()` helper**, **conditional requiredness across fields (cover→coverAlt) cannot be expressed at the schema level**, and **deleting an entry does not remove its attached images** — all three were workaroundable, and none of them rose to "you simply cannot build it this way." Still, all three were found by **actually running into them** during T0–T9, so it is worth recording that these are the kind of costs you would struggle to anticipate from reading the Keystatic docs alone.

**The production adoption call is left below in §5 as a draft; the final decision belongs to a human (Jin)** (`docs/WORKFLOW.md` §4).

## 1. Human smoke checklist (TESTING.md §5)

| #   | Item                                                                                                                                                  | Result                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `npm run dev` → `/keystatic` → author one new post (including a cover) → confirm the file is created in `src/content/posts/`                            | ✅ Done — see §1.1 below                                          |
| 2   | Confirm the draft toggle works → `npm run build && npm run verify` → confirm the new post appears and drafts are excluded                               | ✅ Done — see §1.2 below                                          |
| 2+  | (Not in the spec, added to cover the full CRUD cycle) confirm deletion works                                                                            | ✅ Done — see §1.3 below; found leftover attached images           |
| 3   | Visual review via `npm run preview` (typeface, spacing, mobile width) → adjustments only through tokens.css values                                      | ⏳ **Human's job** — see §1.4 below                               |
| 4   | Record the observations in this document                                                                                                                | ✅ This document                                                   |

### 1.1 Creating a new entry

At `/keystatic/collection/posts/create` we filled in "T10 Smoke Test Post" — title, excerpt, date, author (Priya Castellanos), tags (smoke-test), cover image + alt, and body — then clicked Create, and confirmed that `src/content/posts/t10-smoke-test-post.mdoc` (frontmatter + Markdoc body) and `public/posts-images/t10-smoke-test-post/cover.png` were immediately created on the filesystem. The slug is generated automatically from the title (and can be edited by hand).

### 1.2 Draft toggle + build behavior

Check Draft → Save → confirmed `draft: true` in `t10-smoke-test-post.mdoc` → `npm run build` → neither the post page nor the tag page is in dist (still 19 pages) → `npm run verify` green at 80/80. Uncheck Draft → Save → confirmed `draft: false` → rebuild → both the post page and the new tag page (`/tags/smoke-test/`) are generated (21 pages) → `npm run verify` green at 86/86. **Verified empirically that the draft-exclusion policy survives intact all the way from CMS action to build.**

### 1.3 Deletion

Trash icon in the top right → the confirmation dialog "Are you sure? This action cannot be undone." → Yes, delete → confirmed `t10-smoke-test-post.mdoc` was deleted immediately. **However, the cover image directory uploaded to `public/posts-images/t10-smoke-test-post/` was still there after deletion** — manual cleanup is required (details in §2.3). After the test we cleaned it up by hand and confirmed with a rebuild/verify that we were back to 19 pages and 80/80.

### 1.4 Visual review — needs human confirmation

During T0–T9 we already looked at several pages via screenshots (home, post detail, tags, about, 404) and nothing was visibly off, but that was incidental to checking functionality — it is not the "visual review, final typeface choice, token values locked in" that WORKFLOW.md §4 nailed down. Please open it yourself with `npm run preview` and check the typeface (Source Serif 4 vs Newsreader — the open question in SPEC §7), spacing, and mobile width. If adjustments are needed, changing values in `src/styles/tokens.css` is enough — the components already reference the tokens.

## 2. Editing UX

**What works well**

- The slug is generated automatically as you type the title (and stays editable); the relationship field (author) is a searchable combobox, so there is almost no room to reference a wrong slug through a typo.
- The Markdoc body editor is a split-pane, WYSIWYG-ish editor with a toolbar — buttons for headings, lists, code blocks, and image insertion.
- Image upload is a file picker with an immediate preview; there is no separate save step, the image is committed along with the entry.
- Deletion has a confirmation dialog (§1.3) — good protection against mistakes.

**What grated**

- When the form switches into the split-pane content editor layout after clicking "Add" (on relationship/array fields), the on-screen coordinates of the sidebar fields shift substantially. This caused a few misclicks in automated clicking (this session), and even for a human it can feel jarring — "the field that was right here just moved." Not a big problem, but a detail that can lodge itself in the first-use experience.
- If a cover image is set but coverAlt is left empty, the Keystatic form itself does not block saving (see §2.2) — from an editor's perspective this becomes "it saved fine, but the build fails later."
- Deletion does not remove attached images (§2.3) — repeat that a few times and orphaned directories pile up in `public/posts-images/`.

## 3. Schema expressiveness

- Every field type we used (slug, text + length constraints, date, checkbox, image, array-of-text, array-of-relationship, markdoc) was expressible without trouble.
- **What the image field actually does (measured)**: `fields.image({ directory, publicPath })` writes a **public URL string based on `publicPath`** into the frontmatter (e.g. `/posts-images/<slug>/cover.png`) — not a path relative to the entry file. Astro content collections' `image()` zod helper expects a colocated relative path that Vite processes, so the two do not connect directly. We worked around it by pointing `directory` at `public/` and accepting the value as `z.string()` in zod (`docs/DESIGN.md` §2) — it works, but we give up Vite's automatic image optimization (responsive sizes, format conversion, width/height inference). The more image-heavy the site, the more that loss accumulates.
- **Conditional requiredness cannot be expressed in the schema**: "coverAlt is required if cover is set" cannot be expressed directly with Keystatic field options, so it lives only in the Astro-side zod `.refine()`. That means the rule is completely invisible in the Keystatic editor screen, and violating it is not caught at save time (only at `npm run build`/`verify` time). For a project where accessibility matters, not being able to enforce alt text at the CMS level is a notable shortcoming in production.
- Everything else — text length constraints (`validation.length.min/max`), requiredness (`isRequired`), and array minimum counts (an `array` field's `validation.length.min`) — behaved exactly as expected.

## 4. Parity maintenance cost

- The content model exists separately in two places, `keystatic.config.ts` (editing) and `src/content.config.ts` (zod, consumption) — changing a single field means editing at least two files together.
- `tests/content-parity.test.ts` (T1) automatically catches drift in the field key set and in requiredness — that definitely earns its keep (during T1 we deliberately deleted a field to verify the test really catches it).
- The cost of **building** that test, however, was higher than expected. The internal structure of the field objects that `keystatic.config.ts` exposes at runtime (`kind`/`formKind`) does not reliably distinguish field types (measured: even a plain `fields.text()` returns `formKind: 'slug'`) — so instead of "just introspecting the config" we had to write workaround logic that actually calls each field's public `validate()` API to determine requiredness. The "import keystatic.config and introspect the field key set and requiredness" that `docs/DESIGN.md` originally assumed was easy for the field key set, but required digging considerably deeper for requiredness.
- Because `src/content.config.ts` depends on the `astro:content` virtual module (which does not resolve outside Astro's Vite pipeline), we had to split the zod shapes out into `src/content.schemas.ts` to run the parity test under plain Vitest — minor, but it adds one more piece of indirection that needs explaining to a newcomer who asks "why is this split across files?"

## 5. Production adoption call (draft — the final decision is Jin's)

**Conditionally recommended**: at this project's scale (simple content model, few editors, git-based local storage is enough), using Keystatic in production seems fine. The friction we found above is all the kind you work around once during design, not the kind that repeatedly torments people during operation.

That said, if any of the following applies, we recommend reconsidering before adopting:

- **An image-heavy site where responsive optimization matters** — the optimization loss from the unsupported image() helper accumulates.
- **Many non-developer editors, where enforcing accessibility (alt text) matters** — conditional requiredness cannot be enforced at the CMS level, so it has to be covered by operational discipline (a review process).
- **A content model that will change often and substantially** — even with the parity test, the recurring cost of maintaining a dual schema remains.

None of the three applies within this project's scope (a fictional small editorial blog) — so it is closer to a plain "recommended" than a conditional one, but the final adoption decision and whether to switch to GitHub mode are explicitly left to a human.

## 6. Keystatic GitHub mode (2026-09-08 — SPEC §8, verified empirically on the live deployment)

The user asked to be able to edit directly from the deployed URL after shipping to Vercel, so we implemented GitHub mode, which had originally been a v0.1 non-goal (see §7 for the procedure). The full flow — login, editing, saving, redeploy — has now been exercised end to end on the live deployment. What follows is what we learned, including the one discovery that dominated the whole exercise.

**Keystatic's GitHub mode requires a GitHub App, not a classic OAuth App.** This was the single biggest surprise in the evaluation and cost several failed attempts. The docs and the surrounding ecosystem make "create an OAuth App" sound like the obvious move, and it fails in two distinct, confusingly separate ways:

- Clicking "Log in with GitHub" fails with "Authorization failed" unless the OAuth App has "Token expiration" opted in — Keystatic's token schema requires `expires_in`, `refresh_token`, and `refresh_token_expires_in`, which a classic OAuth App does not return unless expiring tokens are enabled.
- Even after login succeeds and the content lists render, pressing Save fails with
  `[GraphQL] Your token has not been granted the required scopes ... 'createCommitOnBranch' field requires one of the following scopes: ['public_repo'], but your token has only been granted the: [''] scopes.`
  Keystatic never sets a `scope` parameter on the authorize URL at all, because GitHub Apps do not use OAuth scopes — so with a classic OAuth App the token ends up with no scopes whatsoever and every write is rejected.

**Quick diagnostic**: GitHub App client IDs start with `Iv23li`; classic OAuth App client IDs start with `Ov23li`. If you are staring at either failure above, check that prefix first.

**The supported path is Keystatic's built-in setup wizard.** Run the dev server with `PUBLIC_KEYSTATIC_STORAGE=github` and open `/keystatic/setup` (the wizard only exists in development). It submits a GitHub App Manifest to GitHub requesting `contents: write`, `metadata: read`, and `pull_requests: read`, registers callback URLs for both localhost and the deployed origin, and writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` into a local `.env`.

**Creating the App is not enough — it must also be installed on the repository.** Go to `https://github.com/apps/<slug>/installations/new` and choose the specific repository. Without the installation the token carries no repository access and Save fails with exactly the `createCommitOnBranch` error above, which makes it easy to misdiagnose as another credential problem.

Other things worth knowing:

- **Five environment variables are needed in production, not four**: the four the wizard writes plus `PUBLIC_KEYSTATIC_STORAGE=github`.
- **Rotating `KEYSTATIC_SECRET` invalidates existing session cookies**, which is the clean way to force a re-login after swapping credentials — a stale cookie keeps serving the old app's token, so without rotation you can keep reproducing a failure you already fixed.
- **Authorization model**: anyone can reach `/keystatic` and log in, but write access is exactly GitHub repository write permission. Additional testers must be added as repository Collaborators with Write.
- **End-to-end result, verified on the live deployment**: editing a post in the deployed `/keystatic` commits directly to `main`, Vercel auto-redeploys, and the change appears on the public site.

**Also confirmed at the code level (tracing node_modules sources directly + real build/browser testing)**:

- `@keystatic/astro` injects only the two routes `/keystatic` and `/api/keystatic` with `prerender:false` — unlike local mode, only those two routes need server rendering and the rest of the pages stay static.
- The OAuth callback path is `/api/keystatic/github/oauth/callback`, and the required secrets are `KEYSTATIC_GITHUB_CLIENT_ID`/`_SECRET` and `KEYSTATIC_SECRET` — exact names confirmed in the sources.
- Making `storage` switch automatically between local/github by environment variable preserves the local development experience (the observations in §1–§4) as-is — with no secrets locally you get exactly the local mode used so far (measured: after `npm run dev`, `/keystatic` shows the dashboard immediately, with no login screen).
- **We caught a real bug**: writing the storage switch as `process.env.KEYSTATIC_GITHUB_CLIENT_ID` made the admin UI fail to even hydrate, with `ReferenceError: process is not defined` in the browser console — `keystatic.config.ts` is bundled into the browser as well as the server, and `process` is a Node global that does not exist in the browser. Fixed by reading a separate `PUBLIC_`-prefixed flag (`PUBLIC_KEYSTATIC_STORAGE`) through `import.meta.env` (measured: setting that flag to `github` does produce the "Log in with GitHub" screen).
- **`astro preview` does not work at all with the `@astrojs/vercel` adapter** ("The @astrojs/vercel adapter does not support the preview command") — we changed `npm run preview` to `vite preview --outDir dist/client` so it serves only the static public pages. Reproducing `/keystatic` wholesale locally would require Vercel's `vercel dev` CLI (which needs a separate login; not wired into this project).

**Still not measured**:

- How long login sessions last, and how conflicts are handled when several people edit at once.
- How much the cold start of the Vercel serverless function affects the perceived load time of the first `/keystatic` request.

For the full catalogue of failure modes and the recovery procedure, see `docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md`.

## 7. Deployment procedure (Vercel — including GitHub mode, as of 2026-09-08)

1. Vercel dashboard → New Project → connect the GitHub repo (`Trapa-Eureka/astro-page`); private repos work too.
   **Done** (the user already deployed it: `https://astro-page-sigma.vercel.app`).
2. Framework Preset: Astro is auto-detected — with the `@astrojs/vercel` adapter present, Vercel builds and deploys through the Build Output API, so there is no need to configure Build/Output commands by hand.
3. **Create a GitHub App via the Keystatic setup wizard** — do **not** create a classic OAuth App (see §6 for why it fails):
   - Run the dev server with `PUBLIC_KEYSTATIC_STORAGE=github` and open `/keystatic/setup` (development only).
   - The wizard registers a GitHub App with `contents: write`, `metadata: read`, `pull_requests: read` and callback URLs for both localhost and `https://astro-page-sigma.vercel.app`, then writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` into a local `.env`.
   - Sanity check: the client ID must start with `Iv23li` (a classic OAuth App's starts with `Ov23li`).
4. **Install the App on the repository** — `https://github.com/apps/<slug>/installations/new`, selecting the specific repo. Without this, login succeeds but Save fails with the `createCommitOnBranch` scope error.
5. **Register five environment variables on Vercel** (Project Settings → Environment Variables, Production): `PUBLIC_KEYSTATIC_STORAGE=github`, `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (the four values from step 3) → redeploy after registering.
6. Visit `https://astro-page-sigma.vercel.app/keystatic` and log in with GitHub, then edit a post and Save — the commit lands on `main`, Vercel redeploys, and the change shows up on the public site. If the domain changes later, `site` in `astro.config.mjs` and the App's callback URLs must be updated together.
7. To grant access to other editors, add them as repository Collaborators with Write. If you swap credentials, rotate `KEYSTATIC_SECRET` as well so stale session cookies do not keep serving the old app's token.

If anything in this procedure fails, `docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md` has the full failure catalogue and the recovery steps.
