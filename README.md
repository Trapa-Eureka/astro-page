# astro-test

**A test website for evaluating Astro + Keystatic** — the engineering blog of a fictional web
development studio, "Makinilya Studio".

- Reference: we borrow **only the layout grammar** of https://theguardian.engineering/ — the
  editorial blog pattern (strong serif headlines, a reverse-chronological article list on the
  home page, single-column article pages). **No content, logo, proprietary typeface, or copy is
  ever reproduced** (see the prohibition list in SPEC §2).
- All content is original: 6–8 fictional web development posts written by three fictional authors
  at Makinilya Studio (_makinilya_ = Tagalog for "typewriter"). The company and author names are
  placeholders and can be swapped at any time.
- The real purpose of this project: **evaluating Keystatic as a candidate CMS for production
  use**. The deliverable is the Keystatic evaluation memo (T10).

## Stack summary

Astro (latest stable, TS strict) + Keystatic (local mode locally, GitHub mode on Vercel —
switched automatically by an environment variable) + React and Markdoc integrations +
the `@astrojs/vercel` adapter + hand-written CSS design tokens + self-hosted open fonts. Public
content pages are fully static; only `/keystatic` and `/api/keystatic` are rendered on demand and
are protected by GitHub authentication.

## Document map

| Document                                | Contents                                                                        | When to read it                            |
| --------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `CLAUDE.md`                             | Agent steering — stack, commands, conventions, guardrails                       | At the start of every agent session (auto-loaded) |
| `docs/SPEC.md`                          | Product spec — what may be borrowed from the reference and what may not, page inventory, evaluation goals | Before discussing features or judging scope |
| `docs/DESIGN.md`                        | Technical design — content model (dual schema), routes, build verifier          | Required reading before implementing       |
| `docs/TESTING.md`                       | Test strategy — schema parity, dist inspection (zero browser)                   | Before writing tests                       |
| `docs/TASKS.md`                         | Task backlog — units of agent work, acceptance criteria                         | When assigning work                        |
| `docs/WORKFLOW.md`                      | AI-native development rules (shared + repo-specific)                            | Once up front, then as a reference         |
| `docs/EVAL-KEYSTATIC.md`                | Keystatic evaluation memo — the real deliverable of this project (T10)          | When deciding whether to adopt Keystatic   |
| `docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md` | Every Keystatic ↔ GitHub failure we actually hit, with root causes and fixes | When the CMS breaks on the deployed site   |

## How this repo is developed

Same as the five repos before it: **docs → agent implementation → verification**. A human owns the
spec, visual review, and the Keystatic editing smoke test; Claude Code implements one
`docs/TASKS.md` task at a time. The shared gate is `npm run check`; the site-quality gate is
`npm run verify` (which inspects the build output).

## Quickstart

```bash
npm install
npm run check      # astro check + lint + format:check + vitest(unit) — the shared gate
npm run dev        # dev server: http://localhost:4321 (+ the /keystatic admin UI)
npm run build      # static build (with adapter) → dist/client (public pages) + server functions (/keystatic)
npm run verify     # build-output inspection suite (run after build; cheerio+fs only, inspects dist/client)
npm run preview    # local preview of dist/client (vite preview — astro preview is unsupported by the adapter)
```

After pulling a commit that adds a dependency to `package.json`, run `npm install` before
`npm run dev` / `npm run verify` — `node_modules` is not committed.

**Routes**: `/` (home, paginated as `/page/2`…) · `/posts/[slug]` · `/tags/[tag]` · `/about` ·
`/404` · `/rss.xml` · `/sitemap-index.xml` · `/keystatic` (local mode locally; GitHub login on
the deployed site — see `docs/EVAL-KEYSTATIC.md`).

---

## Appendix: Keystatic ↔ GitHub integration — error cases at a glance

Getting Keystatic to edit a **deployed** site is where nearly all of this project's real trouble
lived. The table below is a fast index of every failure we actually hit; the full write-up, with
root causes, source-level evidence, and step-by-step recovery, is in
**[`docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md`](docs/TROUBLESHOOTING-GITHUB-KEYSTATIC.md)**.

### The three rules that prevent most of it

1. **Keystatic's GitHub mode requires a GitHub App, not a classic OAuth App.** An OAuth App gets
   you a working-looking admin UI that fails the moment you press Save.
2. **Creating the GitHub App is only half of it — it must also be _installed_ on the repository.**
   Creation alone grants no access.
3. **Environment variables apply only to new deployments, and a stale session cookie keeps using
   the old credentials.** After swapping credentials: redeploy _and_ log in again.

Quick identity check on a client ID: `Iv23li…` = GitHub App (correct). `Ov23li…` = classic OAuth
App (will fail at Save).

### Failure index

| #   | What you see                                                                   | Root cause                                                                    | Fix                                                                          |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `/keystatic` is 404 on the deployed site (fine on `npm run dev`)               | No adapter / admin route excluded from the production build. GitHub mode needs a request-time server | Add `@astrojs/vercel` and mount `keystatic()` unconditionally; keep `output: 'static'` |
| 2   | Admin UI is blank; console says `ReferenceError: process is not defined`       | `keystatic.config.ts` is bundled into the browser too, where `process` does not exist | Branch on `import.meta.env.PUBLIC_KEYSTATIC_STORAGE` instead of `process.env` |
| 3   | `npm run preview` fails: "adapter does not support the preview command"        | `@astrojs/vercel` genuinely does not support `astro preview`                   | Use `vite preview --outDir dist/client` (public pages only)                   |
| 4   | Verify suite suddenly finds nothing / two assertions fail                      | With an adapter, static output moves from `dist/` to `dist/client/`, and the admin bundle legitimately exists there | Resolve `dist/client` first; re-frame the assertions as "no public page references it" |
| 5   | `/keystatic` opens with no login prompt, even in a private window              | Still running in local storage mode — `PUBLIC_KEYSTATIC_STORAGE` is not literally `github` | Set it to `github`, redeploy, confirm with the `curl` check below            |
| 6   | Variables look right, behaviour unchanged                                       | Vercel bakes env vars in at build time                                        | Redeploy; check the deployment timestamp                                      |
| 7   | **Authorization failed** right after clicking "Log in with GitHub"             | Keystatic requires `expires_in` / `refresh_token` / `refresh_token_expires_in` in the token response | On an OAuth App: Optional features → Token expiration → Opt-in. Properly: move to a GitHub App |
| 8   | Collections show `0 entries` although the files exist                          | Downstream symptom of a failed authorization, not a content or schema problem | Fix the login; the lists populate immediately                                 |
| 9   | ⭐ Save fails: `'createCommitOnBranch' … requires … ['public_repo'], but your token has only been granted the: [''] scopes` | **Wrong app type.** Keystatic never sends a `scope` parameter, because GitHub Apps do not use scopes | Create a GitHub App with Keystatic's wizard at `/keystatic/setup` (dev only)  |
| 10  | Same error, but you did create a GitHub App                                    | The App is not **installed** on the repository                                 | `https://github.com/apps/<slug>/installations/new` → select the repo → Install |
| 11  | Same error, App created *and* installed                                        | Production still holds the old credentials, and/or a stale session cookie carries the old token | Update all five env vars, redeploy, force re-login (rotating `KEYSTATIC_SECRET` invalidates sessions) |

> Note on the error text in #9: it tells you to add scopes and links to personal access token
> settings. Both are dead ends — the fix is to change the *app type*.

### One-line health check

```bash
curl -s -o /dev/null -D - https://<your-domain>/api/keystatic/github/login | grep -i '^location:'
```

The `location:` header answers three questions at once: whether GitHub mode is live at all, which
app is configured (`client_id=Iv23li…` vs `Ov23li…`), and whether the callback URL matches your
production origin.

### Production environment variables (five, not four)

| Variable                           | Value                                        | Secret? |
| ---------------------------------- | -------------------------------------------- | ------- |
| `PUBLIC_KEYSTATIC_STORAGE`         | `github`                                     | no      |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | the GitHub App slug                          | no      |
| `KEYSTATIC_GITHUB_CLIENT_ID`       | starts with `Iv23li…`                        | no      |
| `KEYSTATIC_GITHUB_CLIENT_SECRET`   | from the App                                 | **yes** |
| `KEYSTATIC_SECRET`                 | random string; encrypts the session cookie    | **yes** |

### Who can edit

Anyone can reach `/keystatic` and log in with GitHub, but saving requires **write access to the
content repository** — the CMS inherits GitHub's permissions exactly. To let someone else edit,
add them as a repository **Collaborator** with **Write**. A save commits straight to `main`,
which triggers a redeployment, so the change is live on the public site a minute or two later.
