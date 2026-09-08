// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// 2026-09-08: switched Keystatic to GitHub-mode storage so /keystatic works on the live
// Vercel deployment, not just `npm run dev` (see docs/EVAL-KEYSTATIC.md and CLAUDE.md
// guardrail 3 for the full reasoning). @keystatic/astro's integration injects its own two
// routes — /keystatic/[...params] and /api/keystatic/[...params] — with prerender:false;
// every other route (home, posts, tags, about, 404, rss.xml) is untouched and keeps
// prerendering to plain static HTML like before. That mix only works with an adapter
// present, hence @astrojs/vercel — output stays 'static' (the default), no per-page
// changes needed. react()/markdoc()/sitemap()/keystatic() are now all unconditional: the
// admin UI is meant to exist in production now, gated by GitHub OAuth rather than by
// never being built at all.
export default defineConfig({
  site: 'https://astro-page-sigma.vercel.app',
  adapter: vercel(),
  integrations: [markdoc(), sitemap(), react(), keystatic()],
});
