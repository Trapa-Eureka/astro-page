// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

// https://astro.build/config
// React is only needed to render Keystatic's admin UI (/keystatic) — production pages
// never use a React island (CLAUDE.md guardrail). SKIP_KEYSTATIC=true (set by `npm run
// build`) excludes both react() and keystatic() together so production builds ship no
// admin routes and no React runtime chunk at all (verified: without this, @astrojs/react
// still emits an unreferenced ~190KB client bundle into dist/_astro even with zero
// islands in use). markdoc() and sitemap() stay unconditional: markdoc() renders the
// actual post content, and sitemap() only reads the routes Astro actually generates — since
// draft posts and /keystatic never generate a route in a SKIP_KEYSTATIC build (verified in
// T0/T4), the sitemap excludes them automatically, no extra filtering needed.
export default defineConfig({
  // Placeholder — swap for the real deployed origin at T10 (Vercel). Needed for absolute
  // canonical/OG URLs and RSS/sitemap (T6); company name is a placeholder throughout anyway.
  site: 'https://makinilya-engineering.example',
  integrations: [
    markdoc(),
    sitemap(),
    ...(process.env.SKIP_KEYSTATIC ? [] : [react(), keystatic()]),
  ],
});
