import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listAllDistFiles, listHtmlFiles, loadHtml, urlPathFor } from './helpers';

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

describe('SKIP_KEYSTATIC wiring: no admin routes, no React runtime', () => {
  it('no file path under dist contains "keystatic"', () => {
    const offenders = listAllDistFiles().filter((f) => f.toLowerCase().includes('keystatic'));
    expect(offenders).toEqual([]);
  });

  it('dist ships zero JavaScript files (fully static — no React/admin runtime chunk)', () => {
    const jsFiles = listAllDistFiles().filter((f) => f.endsWith('.js'));
    expect(jsFiles, jsFiles.join('\n')).toEqual([]);
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
});
