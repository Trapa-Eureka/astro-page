import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST_DIR, draftPostSlugs, listHtmlFiles, loadHtml, loadXml, urlPathFor } from './helpers';

// TESTING.md §4 "메타·구독"

describe('every page: title, meta description, OG(title/type/url)', () => {
  for (const file of listHtmlFiles()) {
    it(`${urlPathFor(file)} has non-empty title/description/OG tags`, () => {
      const $ = loadHtml(file);
      expect($('title').text().trim().length, 'title').toBeGreaterThan(0);
      expect(
        ($('meta[name="description"]').attr('content') ?? '').trim().length,
        'description',
      ).toBeGreaterThan(0);
      expect(
        ($('meta[property="og:title"]').attr('content') ?? '').trim().length,
        'og:title',
      ).toBeGreaterThan(0);
      expect(
        ($('meta[property="og:type"]').attr('content') ?? '').trim().length,
        'og:type',
      ).toBeGreaterThan(0);
      expect(
        ($('meta[property="og:url"]').attr('content') ?? '').trim().length,
        'og:url',
      ).toBeGreaterThan(0);
    });
  }
});

describe('rss.xml', () => {
  const postsDir = join(DIST_DIR, 'posts');
  const publicPostCount = existsSync(postsDir) ? readdirSync(postsDir).length : 0;
  const rssPath = join(DIST_DIR, 'rss.xml');

  it('exists and parses', () => {
    expect(existsSync(rssPath)).toBe(true);
    const $ = loadXml(rssPath);
    expect($('rss > channel').length).toBe(1);
  });

  it('item count equals the number of published posts', () => {
    const $ = loadXml(rssPath);
    expect($('item').length).toBe(publicPostCount);
  });

  it('contains no draft post link', () => {
    const $ = loadXml(rssPath);
    const links = $('item > link')
      .map((_, el) => $(el).text())
      .get();
    for (const slug of draftPostSlugs()) {
      expect(
        links.some((link) => link.includes(`/posts/${slug}/`)),
        `rss.xml should not link draft "${slug}"`,
      ).toBe(false);
    }
  });
});

describe('sitemap', () => {
  const sitemapIndexPath = join(DIST_DIR, 'sitemap-index.xml');
  const sitemapPath = join(DIST_DIR, 'sitemap-0.xml');

  it('sitemap-index.xml and sitemap-0.xml exist', () => {
    expect(existsSync(sitemapIndexPath)).toBe(true);
    expect(existsSync(sitemapPath)).toBe(true);
  });

  it('URL count matches the number of public HTML pages (404 excluded by convention)', () => {
    const publicPageCount = listHtmlFiles().filter((f) => urlPathFor(f) !== '/404.html').length;
    const $ = loadXml(sitemapPath);
    expect($('url > loc').length).toBe(publicPageCount);
  });

  it('contains no draft post URL and no /keystatic URL', () => {
    const $ = loadXml(sitemapPath);
    const locs = $('url > loc')
      .map((_, el) => $(el).text())
      .get();
    expect(locs.some((loc) => loc.includes('/keystatic'))).toBe(false);
    for (const slug of draftPostSlugs()) {
      expect(locs.some((loc) => loc.includes(`/posts/${slug}/`))).toBe(false);
    }
  });
});
