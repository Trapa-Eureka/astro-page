import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listAllDistFiles, listHtmlFiles, loadHtml, ROOT_DIR, urlPathFor } from './helpers';

// TESTING.md §4 "정책·접근성 기본"

const PAGE_SIZE_BUDGET_BYTES = 100 * 1024;
// astro.config.mjs's placeholder site — the only "external" origin dist is allowed to
// reference (its own canonical/OG/RSS/sitemap URLs point at itself).
const OWN_SITE_ORIGIN = 'https://makinilya-engineering.example';

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

// T8 hardens this beyond T7's path-only check. Note what it deliberately does NOT do: a
// blind case-insensitive text scan for "keystatic" across dist. That was tried first and
// false-positived on this site's own content — the seed post "Shipping a CMS Without
// Losing Your Static Site" legitimately discusses Keystatic by name, so do its home-page
// excerpt, its rss.xml entry, and its tag pages. Mentioning a product's name in prose is
// not evidence its admin UI shipped. The real, false-positive-free signal is: no href/src
// anywhere points at the /keystatic/ route, and no runtime exists that could render an
// admin UI even if a route did — zero <script> tags, not just zero .js files (an inline
// <script> would slip past a "no .js files" check entirely).
describe('SKIP_KEYSTATIC wiring: no admin routes, no React runtime', () => {
  it('no file path under dist contains "keystatic"', () => {
    const offenders = listAllDistFiles().filter((f) => f.toLowerCase().includes('keystatic'));
    expect(offenders).toEqual([]);
  });

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

  it('dist ships zero JavaScript files (fully static — no React/admin runtime chunk)', () => {
    const jsFiles = listAllDistFiles().filter((f) => f.endsWith('.js'));
    expect(jsFiles, jsFiles.join('\n')).toEqual([]);
  });

  it('dist HTML has zero <script> tags (not just zero .js files — an inline script would evade that check)', () => {
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

  // T8: a standing report, not just a pass/fail — docs/TASKS.md's "용량 예산 리포트".
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
