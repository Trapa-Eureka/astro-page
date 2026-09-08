# TROUBLESHOOTING — Keystatic ↔ GitHub integration

Everything in this document was hit for real while taking this site from "Keystatic works on
localhost" to "Keystatic edits the live Vercel deployment", on 2026-09-08. Nothing here is
hypothetical: every symptom is a verbatim error message we saw, and every root cause was
confirmed either in `node_modules/@keystatic/**` source or in GitHub's own settings UI.

Read §1 if you are setting this up for the first time. Read §2 if something is already broken —
it is indexed by the exact error text you are staring at.

---

## 0. TL;DR — the four things that actually matter

1. **Keystatic's GitHub mode needs a GitHub App, not a classic OAuth App.** This is the single
   biggest trap. A classic OAuth App gets you all the way to a working-looking admin UI and then
   fails at the moment you press Save.
2. **Creating the GitHub App is only half of it — you must also _install_ it on the repository.**
   Creation grants nothing.
3. **Static hosting alone cannot serve `/keystatic` in GitHub mode.** Login and commits happen
   server-side at request time, so the project needs an adapter (`@astrojs/vercel`) and the two
   Keystatic routes must be on-demand.
4. **Environment variables only take effect on a new deployment, and a stale session cookie will
   keep using the old credentials.** After swapping credentials: redeploy *and* re-login.

Fast identity check for a GitHub client ID:

| Prefix     | What it is                    | Works with Keystatic? |
| ---------- | ----------------------------- | --------------------- |
| `Iv23li…`  | GitHub App client ID          | ✅ Yes                |
| `Ov23li…`  | Classic OAuth App client ID   | ❌ No — Save will fail |

---

## 1. The correct setup, start to finish

### 1.1 Project side (already done in this repo)

| What                         | Where                                   |
| ---------------------------- | --------------------------------------- |
| Vercel adapter               | `astro.config.mjs` → `adapter: vercel()` |
| Keystatic + React mounted    | `astro.config.mjs` → `integrations`      |
| Storage mode switch          | `keystatic.config.ts` (reads `import.meta.env.PUBLIC_KEYSTATIC_STORAGE`) |
| Local preview of static output | `npm run preview` → `vite preview --outDir dist/client` |

`@keystatic/astro` injects exactly two routes, both with `prerender: false`:
`/keystatic/[...params]` (admin UI) and `/api/keystatic/[...params]` (API). Every public page
stays a pure static prerender — the adapter does not change that.

### 1.2 Create the GitHub App with Keystatic's own wizard

Do **not** hand-create the app. Keystatic ships a wizard that submits a correct GitHub App
Manifest, which removes all guesswork about permissions and callback URLs. The wizard is gated to
`NODE_ENV === 'development'`, so it only exists on a local dev server.

```bash
PUBLIC_KEYSTATIC_STORAGE=github npm run dev
# then open http://localhost:4321/keystatic/setup   (note: /setup, not /keystatic)
```

In the wizard:

- **Deployed App URL** — fill this in with your production origin
  (e.g. `https://astro-page-sigma.vercel.app`). ⚠️ **If you leave this blank, the GitHub App will
  be created without a production callback URL**, and login on the deployed site will later fail
  with a redirect-URI mismatch. Fixing that afterwards means editing the App's redirect URIs by
  hand.
- **GitHub organization** — leave blank for a personal account.

Click **Create GitHub App**. GitHub may ask you to re-authenticate ("Confirm access" / sudo mode)
— that is normal for app creation. Confirm the app name on GitHub's page, then click
**Create GitHub App for `<account>`**.

The manifest Keystatic submits requests exactly:

```json
{
  "default_permissions": {
    "contents": "write",
    "metadata": "read",
    "pull_requests": "read"
  },
  "request_oauth_on_install": true
}
```

…plus callback URLs for `localhost`, `127.0.0.1`, and your deployed origin.

When GitHub redirects back, Keystatic writes four values into a local `.env`:

```
KEYSTATIC_GITHUB_CLIENT_ID
KEYSTATIC_GITHUB_CLIENT_SECRET
KEYSTATIC_SECRET
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
```

`.env` is git-ignored. Never commit it.

### 1.3 Install the App on the repository

**Creating the App grants zero repository access.** Install it:

```
https://github.com/apps/<PUBLIC_KEYSTATIC_GITHUB_APP_SLUG>/installations/new
```

Choose the account → **Only select repositories** → select the content repo → **Install**.

Verify at `https://github.com/settings/installations` → *Configure*. You should see:

- Permissions: *Read and write access to code*, read access to metadata and pull requests
- Repository access: your repo, explicitly listed

### 1.4 Set the five production environment variables

In Vercel → Project → Settings → Environment Variables (Production scope):

| Variable                           | Value                                   | Secret? |
| ---------------------------------- | --------------------------------------- | ------- |
| `PUBLIC_KEYSTATIC_STORAGE`         | `github`                                | no      |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | the app slug, e.g. `acme-keystatic`     | no      |
| `KEYSTATIC_GITHUB_CLIENT_ID`       | starts with `Iv23li…`                   | no      |
| `KEYSTATIC_GITHUB_CLIENT_SECRET`   | from `.env`                             | **yes** |
| `KEYSTATIC_SECRET`                 | from `.env` (session-cookie encryption) | **yes** |

Then **redeploy**. Vercel applies environment variables to *new* deployments only.

### 1.5 Verify before you click anything

One command tells you whether the deployment actually picked up the right credentials:

```bash
curl -s -o /dev/null -D - https://<your-domain>/api/keystatic/github/login | grep -i '^location:'
```

Expected: a redirect to `https://github.com/login/oauth/authorize?client_id=Iv23li…&redirect_uri=https%3A%2F%2F<your-domain>%2Fapi%2Fkeystatic%2Fgithub%2Foauth%2Fcallback`

- `client_id` starting with `Ov23li` → the old OAuth App is still configured. Save will fail.
- a `redirect_uri` that is not your production origin → wrong deployment or wrong env scope.

---

## 2. Failure catalogue

Indexed by what you actually see. Each row is a failure we hit and fixed.

### 2.1 `/keystatic` returns 404 on the deployed site

**Symptom** — the public site works; `/keystatic` is a 404. Works fine on `npm run dev`.

**Cause** — the production build never emitted the admin route. Either the integration is
excluded from production builds, or there is no adapter, so nothing can serve an on-demand route.
A purely static host has no request-time server, and GitHub mode fundamentally needs one (OAuth
callback + GitHub API calls).

**Fix** — add an adapter (`@astrojs/vercel`) and mount `keystatic()` unconditionally. You do
**not** need `output: 'server'`: Astro's default `output: 'static'` supports per-route
`prerender: false` as long as an adapter is present, and Keystatic injects its two routes that
way already.

---

### 2.2 Admin UI is blank; console shows `ReferenceError: process is not defined`

**Symptom** — `/keystatic` loads an empty page. Console: `process is not defined`.

**Cause** — `keystatic.config.ts` is bundled into the **browser** as well as the server (the admin
UI needs the schema client-side). `process.env` does not exist in a browser bundle, so any
`process.env.X` in that file crashes hydration.

**Fix** — branch on a Vite-isomorphic, `PUBLIC_`-prefixed variable instead:

```ts
const storage: Config['storage'] =
  import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
    ? { kind: 'github', repo: { owner: '…', name: '…' } }
    : { kind: 'local' };
```

Only `PUBLIC_`-prefixed variables are exposed to the client bundle; unprefixed ones silently
resolve to `undefined` there, which is *not* an error but is also not a usable signal. Real
secrets stay server-only and are read by Keystatic via `getSecret()` from `astro:env/server`.

---

### 2.3 `npm run preview` fails after adding the adapter

**Symptom** — `The @astrojs/vercel adapter does not support the preview command.`

**Cause** — exactly what it says. Adapters that deploy to a platform runtime generally cannot be
replayed by `astro preview`.

**Fix** — preview the static output directly: `vite preview --outDir dist/client`. This serves
the public pages (enough for visual review) but cannot serve `/keystatic`; reproducing the
on-demand routes locally requires that platform's own CLI (`vercel dev`).

---

### 2.4 The dist-inspection suite breaks after adding the adapter

**Symptom** — verify tests that previously read `dist/` find nothing, and two assertions
("no keystatic path anywhere in dist", "zero JS files in dist") start failing legitimately.

**Cause** — with an adapter, Astro's static output moves from `dist/` to `dist/client/`, and the
admin UI's client bundle (a few MB of `_astro/keystatic-page.*.js`) now genuinely exists there.

**Fix** — make the suite's `DIST_DIR` resolve `dist/client` when present and fall back to `dist`.
Then re-frame the two assertions from *"this file must not exist"* to *"no public page must
reference it"* — check `href`/`src` attributes and `<script>` tags on the public pages instead of
scanning the whole tree. The guarantee we actually care about (public pages ship zero JS and never
link the admin) is preserved; the assertion is just aimed at the right thing.

> Related trap: do not test this by scanning *page text* for the string "keystatic". One of the
> seed posts legitimately discusses Keystatic by name, which produced a false positive.

---

### 2.5 `/keystatic` opens with no login prompt, even in a private window

**Symptom** — the deployed admin UI opens straight into the dashboard for anyone.

**Cause** — the app is still running in **local storage mode**. In local mode there is no auth by
design (it writes to the local filesystem). Almost always this means
`PUBLIC_KEYSTATIC_STORAGE` is not literally `github` — either unset, misspelled, or set on the
wrong deployment.

**Fix** — set the value to `github`, redeploy, confirm with the `curl` check in §1.5. If the
route redirects to `github.com/login/oauth/authorize`, GitHub mode is live.

> Two data-entry mistakes we actually made in the Vercel UI, both worth double-checking:
>
> - pasting the **same value** into both `KEYSTATIC_GITHUB_CLIENT_ID` and
>   `KEYSTATIC_GITHUB_CLIENT_SECRET`;
> - typing the word **`Config`** into the *Value* field — that is the name of Vercel's
>   *Type* selector (Secret / Config), not a value.

---

### 2.6 Environment variables are correct but nothing changed

**Symptom** — you fixed the variables, reloaded, same behaviour.

**Cause** — Vercel bakes environment variables into a deployment at build time. Editing them does
not touch the deployment that is already live.

**Fix** — trigger a redeploy, and confirm the deployment timestamp is newer than your edit.

---

### 2.7 "Authorization failed" immediately after clicking *Log in with GitHub*

**Symptom** — GitHub redirects back to `/api/keystatic/github/oauth/callback?code=…` and
Keystatic renders **Authorization failed**.

**Cause** — Keystatic validates GitHub's token response against a schema that **requires**
`expires_in`, `refresh_token`, and `refresh_token_expires_in`. A classic OAuth App only returns
those fields if token expiration is enabled; without it the response is rejected and the whole
login fails.

**Fix (if you are still on a classic OAuth App)** — GitHub → Settings → Developer settings →
OAuth Apps → *your app* → **Optional features** tab → **Token expiration** → *Opt-in*. Note this
lives on its own tab after registration; it is not on the app's General page.

**Better fix** — move to a GitHub App (§1.2). GitHub App tokens carry these fields natively, and
this failure mode disappears. See §2.9 for why you have to move anyway.

---

### 2.8 Collections show "0 entries" after logging in

**Symptom** — the admin UI renders, sidebar shows Posts / Authors, but both say `0 entries`,
even though the files exist in the repo.

**Cause** — in our case this was **not** a separate bug. It was the downstream symptom of the
failed authorization in §2.7: without a valid token Keystatic cannot read the repo tree, so every
collection renders empty rather than erroring loudly.

**Fix** — fix the login (§2.7 / §2.9). The lists populate immediately afterwards.

> Lesson: an empty collection list in GitHub mode is an *auth* symptom far more often than a
> content or schema symptom. Check the token before you go looking at `keystatic.config.ts`.

---

### 2.9 ⭐ Save fails with a GraphQL "scopes" error — the root cause of most of this

**Symptom** — everything looks healthy: logged in, content lists render, you edit a post, press
**Save**, and get:

```
[GraphQL] Your token has not been granted the required scopes to execute this query.
The 'createCommitOnBranch' field requires one of the following scopes: ['public_repo'],
but your token has only been granted the: [''] scopes.
Please modify your token's scopes at: https://github.com/settings/tokens.
```

**Cause** — you are using a **classic OAuth App**. Keystatic's login code never sets a `scope`
parameter on the authorize URL *at all*, because GitHub Apps do not use OAuth scopes — their
access comes from the App's configured permissions plus its installation on a repo. Hand an
OAuth App that same scope-less authorize request and you get a token with literally `['']`
scopes: enough to read your identity, not enough to commit.

The error message is misleading on two counts: it suggests adding scopes, and it links to
personal access token settings. Neither is the fix. **The fix is to change the app type.**

**Fix** — create a GitHub App via Keystatic's wizard (§1.2), install it (§1.3), swap the
credentials (§1.4), redeploy, and log in again (§2.11). The old OAuth App can then be deleted.

---

### 2.10 Same GraphQL error, but you already created a GitHub App

**Symptom** — identical error text as §2.9, after correctly creating a GitHub App.

**Cause** — the App exists but is **not installed on the repository**. An uninstalled GitHub App
has access to nothing, and the resulting user-to-server token reports the same empty permission
set.

**Fix** — install it: `https://github.com/apps/<slug>/installations/new`, pick the repo, Install.
Confirm at `https://github.com/settings/installations` that repository access lists your repo and
permissions include *Read and write access to code*.

Keystatic itself detects this state: when the logged-in user has no write permission and the app
slug is known, it renders an install link pointing at that exact URL. If you see that prompt
instead of your content, this is your problem.

---

### 2.11 Same GraphQL error, App created *and* installed

**Symptom** — identical error text again, with GitHub fully configured correctly.

**Cause** — one (or both) of:

1. **The deployment still holds the old credentials.** The wizard writes the new client ID/secret
   into your *local* `.env`; it has no idea Vercel exists. Until you update the environment
   variables and redeploy, production keeps minting tokens from the old OAuth App.
2. **A stale session cookie.** Even after the credentials change, an existing Keystatic session
   keeps presenting the token the *old* app issued. Nothing about creating or installing an app
   invalidates it.

**Fix** — update all five variables (§1.4) and redeploy; then force a fresh login. Rotating
`KEYSTATIC_SECRET` is the cleanest way to do this: it invalidates every existing session cookie,
so everyone is pushed back through login against the new app. Otherwise log out manually from the
account menu at the bottom-left of the admin UI.

Confirm with the `curl` check in §1.5 *before* testing in the browser — it tells you in one line
whether the deployment is on the new app.

---

## 3. Diagnostic toolbox

| Question                                            | How to answer it in one step                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Is the deployment in GitHub mode at all?             | `curl -sI https://<domain>/api/keystatic/github/login` → a `location:` to github.com = yes |
| Which app is it using?                               | Same response — `client_id=Iv23li…` (GitHub App) vs `Ov23li…` (OAuth App)                |
| Is the callback URL right?                           | Same response — `redirect_uri` must equal `<production origin>/api/keystatic/github/oauth/callback` |
| Is the App installed, and on what?                   | `https://github.com/settings/installations` → *Configure*                                |
| What permissions does the App have?                  | Same page: expect *Read and write access to code*                                        |
| Which redirect URIs are registered?                  | `https://github.com/settings/apps/<slug>` → "Identifying and authorizing users"          |
| Did the local wizard actually write credentials?     | `grep -E '^[A-Z_]+=' .env \| sed -E 's/=.*/=<set>/'` (lists keys without leaking values)  |

---

## 4. Facts worth remembering

- Keystatic's OAuth callback path is hard-coded: `/api/keystatic/github/oauth/callback`. It is not
  configurable, so register it exactly.
- The setup wizard lives at `/keystatic/setup` — a sibling route of the admin UI, not a link
  inside it — and only in development.
- GitHub App creation may trigger GitHub's sudo-mode re-authentication. That is expected.
- The authorization model after all this is simply **GitHub repository write permission**. Anyone
  can reach `/keystatic` and log in; only accounts with write access to the content repo can save.
  To give someone else edit access, add them as a repository **Collaborator** with **Write**.
- Saving from the deployed admin UI commits straight to `main`, which triggers a Vercel
  redeployment; the change is live on the public site a minute or two later.
