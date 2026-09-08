import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listHtmlFiles, loadHtml, ROOT_DIR, urlPathFor } from './helpers';

// TESTING.md §4 "Policy & accessibility basics"

const PAGE_SIZE_BUDGET_BYTES = 100 * 1024;
// astro.config.mjs's site — the only "external" origin dist is allowed to reference (its
// own canonical/OG/RSS/sitemap URLs point at itself).
const OWN_SITE_ORIGIN = 'https://astro-page-sigma.vercel.app';

describe('images: alt text', () => {
  for (const file of listHtmlFiles()) {
    it(`${urlPathFor(file)}: every <img> has alt text (or is explicitly marked decorative)`, () => {
      const $ = loadHtml(file);
      $('img').each((_, el) => {
        const $img = $(el);
        const alt = $img.attr('alt');
        const isDecorative =
          $img.attr('aria-hidden') === 'true' || $img.attr('role') === 'presentation';
        expect(alt !== undefined, `img[src="${$img.attr('src')}"] is missing alt`).toBe(true);
        if (!isDecorative) {
          expect(
            (alt ?? '').trim().length,
            `img[src="${$img.attr('src')}"] has empty alt and no decorative marker`,
          ).toBeGreaterThan(0);
        }
      });
    });
  }
});

describe('landmarks + skip link', () => {
  for (const file of listHtmlFiles()) {
    it(`${urlPathFor(file)} has header/main/footer landmarks and a skip link`, () => {
      const $ = loadHtml(file);
      expect($('header').length, 'header').toBeGreaterThan(0);
      expect($('main').length, 'main').toBe(1);
      expect($('footer').length, 'footer').toBeGreaterThan(0);
      expect($('a.skip-link[href="#main-content"]').length, 'skip link').toBeGreaterThan(0);
      expect($('#main-content').length, '#main-content target').toBe(1);
    });
  }
});

describe('zero external-origin references', () => {
  it('no href/src/preload in dist HTML points outside this site', () => {
    const offenders: string[] = [];
    for (const file of listHtmlFiles()) {
      const $ = loadHtml(file);
      $('[href], [src]').each((_, el) => {
        for (const attr of ['href', 'src']) {
          const value = $(el).attr(attr);
          if (!value) continue;
          if (/^https?:\/\//.test(value) && !value.startsWith(OWN_SITE_ORIGIN)) {
            offenders.push(`${urlPathFor(file)}: ${attr}="${value}"`);
          }
        }
      });
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

// Policy since 2026-09-08 (GitHub-mode Keystatic, docs/DESIGN.md §1): public content pages
// stay fully static and reference zero JS/keystatic assets, but the admin UI's own client
// bundle (React + the Keystatic page component) now legitimately exists as static assets
// under _astro/ — @astrojs/vercel serves /keystatic's client JS from there even though the
// page itself is server-rendered on demand. So this no longer asserts "no keystatic path
// and no .js file exists anywhere in dist" (verified: they do, e.g. _astro/keystatic-page.*.js,
// ~2.7MB) — it asserts the thing that actually matters: no PUBLIC page links to any of it.
// Also still avoids a blind text scan for "keystatic" — the seed post "Shipping a
// CMS Without Losing Your Static Site" legitimately discusses Keystatic by name in its own
// prose (home excerpt, rss.xml, tag pages), so mentioning the product isn't evidence of
// its admin UI leaking into a page.
describe('public pages ship zero JS and reference no keystatic asset', () => {
  it('no href/src in dist HTML points at the /keystatic/ admin route', () => {
    const offenders: string[] = [];
    for (const file of listHtmlFiles()) {
      const $ = loadHtml(file);
      $('[href], [src]').each((_, el) => {
        for (const attr of ['href', 'src']) {
          const value = $(el).attr(attr);
          if (value?.includes('/keystatic')) {
            offenders.push(`${urlPathFor(file)}: ${attr}="${value}"`);
          }
        }
      });
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('no public page references a .js file (via href/src) or a keystatic-named asset', () => {
    const offenders: string[] = [];
    for (const file of listHtmlFiles()) {
      const $ = loadHtml(file);
      $('[href], [src]').each((_, el) => {
        for (const attr of ['href', 'src']) {
          const value = $(el).attr(attr);
          if (!value) continue;
          if (value.endsWith('.js') || value.toLowerCase().includes('keystatic')) {
            offenders.push(`${urlPathFor(file)}: ${attr}="${value}"`);
          }
        }
      });
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('dist HTML has zero <script> tags on any public page', () => {
    const offenders: string[] = [];
    for (const file of listHtmlFiles()) {
      const $ = loadHtml(file);
      if ($('script').length > 0) offenders.push(urlPathFor(file));
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('page size budget', () => {
  it('every HTML page is <= 100KB (fonts excluded — they are separate requests, not inlined)', () => {
    const overBudget: string[] = [];
    for (const file of listHtmlFiles()) {
      const size = statSync(file).size;
      if (size > PAGE_SIZE_BUDGET_BYTES) {
        overBudget.push(`${urlPathFor(file)}: ${size} bytes`);
      }
    }
    expect(overBudget, overBudget.join('\n')).toEqual([]);
  });

  // T8: a standing report, not just a pass/fail — docs/TASKS.md's "page size budget report".
  // Regenerated on every `npm run verify`; gitignored like dist/ itself.
  it('writes a page-size-vs-budget report', () => {
    const rows = listHtmlFiles()
      .map((file) => ({
        path: urlPathFor(file),
        bytes: statSync(file).size,
        percentOfBudget: Math.round((statSync(file).size / PAGE_SIZE_BUDGET_BYTES) * 1000) / 10,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    const report = {
      generatedAt: new Date().toISOString(),
      budgetBytes: PAGE_SIZE_BUDGET_BYTES,
      pages: rows,
      largest: rows[0] ?? null,
      totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    };

    const reportDir = join(ROOT_DIR, 'scripts', 'verify', 'reports');
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(join(reportDir, 'page-sizes.json'), JSON.stringify(report, null, 2));

    expect(rows.length).toBeGreaterThan(0);
  });
});
