import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  DIST_DIR,
  draftPostSlugs,
  listHtmlFiles,
  loadHtml,
  resolveInternalHref,
  urlPathFor,
} from './helpers';

// TESTING.md §4 "존재·무결성"

let htmlFiles: string[];
let postPageCount: number;

beforeAll(() => {
  htmlFiles = listHtmlFiles();
  const postsDir = join(DIST_DIR, 'posts');
  postPageCount = existsSync(postsDir) ? readdirSync(postsDir).length : 0;
});

describe('post pages: existence + h1 uniqueness', () => {
  it('has at least one published post', () => {
    expect(postPageCount).toBeGreaterThan(0);
  });

  it('every post page has exactly one <h1>', () => {
    const postFiles = htmlFiles.filter((f) => urlPathFor(f).startsWith('/posts/'));
    expect(postFiles.length).toBe(postPageCount);
    for (const file of postFiles) {
      const $ = loadHtml(file);
      expect($('h1').length, `${urlPathFor(file)} should have exactly one h1`).toBe(1);
    }
  });

  it('every page in dist has exactly one <h1>', () => {
    for (const file of htmlFiles) {
      const $ = loadHtml(file);
      expect($('h1').length, `${urlPathFor(file)} should have exactly one h1`).toBe(1);
    }
  });
});

describe('internal links resolve to real files (anchors included)', () => {
  it('every internal href/src resolves, and same-page/cross-page anchors resolve to a real id', () => {
    const brokenLinks: string[] = [];
    const brokenAnchors: string[] = [];

    for (const file of htmlFiles) {
      const $ = loadHtml(file);
      const links = new Set<string>();
      $('a[href], link[href]').each((_, el) => {
        links.add($(el).attr('href') ?? '');
      });
      $('img[src], script[src]').each((_, el) => {
        links.add($(el).attr('src') ?? '');
      });

      for (const href of links) {
        if (!href.startsWith('/')) continue; // external/relative/mailto — not this check's job
        const [pathPart, fragment] = href.split('#');
        const targetFile = resolveInternalHref(pathPart || '/');
        if (!targetFile) {
          brokenLinks.push(`${urlPathFor(file)} -> ${href}`);
          continue;
        }
        if (fragment) {
          const target$ = loadHtml(targetFile);
          if (target$(`#${fragment}`).length === 0) {
            brokenAnchors.push(
              `${urlPathFor(file)} -> ${href} (no #${fragment} in ${urlPathFor(targetFile)})`,
            );
          }
        }
      }
    }

    expect(brokenLinks, `broken internal links:\n${brokenLinks.join('\n')}`).toEqual([]);
    expect(brokenAnchors, `broken anchors:\n${brokenAnchors.join('\n')}`).toEqual([]);
  });
});

describe('404 page', () => {
  it('exists, and links to home and the latest post', () => {
    const path = join(DIST_DIR, '404.html');
    expect(existsSync(path)).toBe(true);
    const $ = loadHtml(path);
    const hrefs = $('a[href]')
      .map((_, el) => $(el).attr('href'))
      .get();
    expect(hrefs).toContain('/');
    expect(hrefs.some((href) => href?.startsWith('/posts/'))).toBe(true);
  });
});

describe('draft exclusion (T8: re-verified across every path, not just RSS/sitemap)', () => {
  it('no draft post has a route anywhere in dist', () => {
    const leaks: string[] = [];
    for (const slug of draftPostSlugs()) {
      const routeDir = join(DIST_DIR, 'posts', slug);
      if (existsSync(routeDir)) leaks.push(`dist/posts/${slug}/ exists`);
    }
    expect(leaks, leaks.join('\n')).toEqual([]);
  });

  it('no draft post is linked from anywhere in dist (home, tags, 404, or any other page)', () => {
    const leaks: string[] = [];
    const draftHrefFragments = draftPostSlugs().map((slug) => `/posts/${slug}/`);
    if (draftHrefFragments.length === 0) return; // nothing to check — no drafts in the seed
    for (const file of listHtmlFiles()) {
      const $ = loadHtml(file);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        if (draftHrefFragments.some((fragment) => href.includes(fragment))) {
          leaks.push(`${urlPathFor(file)} links to draft href "${href}"`);
        }
      });
    }
    expect(leaks, leaks.join('\n')).toEqual([]);
  });
});

describe('pagination', () => {
  it('total page count = ceil(published posts / 10), and page 1 has no duplicate route', () => {
    const lastPage = Math.max(1, Math.ceil(postPageCount / 10));
    const pageDir = join(DIST_DIR, 'page');
    const pageDirs = existsSync(pageDir) ? readdirSync(pageDir) : [];

    if (lastPage === 1) {
      // Page 1 lives at "/" — src/lib/postFilters.ts's pageHref boundary — so no /page/*
      // route should exist at all when there's only one page.
      expect(pageDirs).toEqual([]);
    } else {
      expect(pageDirs).not.toContain('1');
      expect(pageDirs.length).toBe(lastPage - 1);
      for (let n = 2; n <= lastPage; n++) {
        expect(existsSync(join(pageDir, String(n), 'index.html')), `page/${n} should exist`).toBe(
          true,
        );
      }
    }
  });
});
