import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { pageHref, publishedPosts, totalPages } from '../src/lib/postFilters';

// Fixture posts carry only the fields publishedPosts() reads (id, data.pubDate,
// data.draft) — cast through unknown since a full CollectionEntry has many fields
// this suite doesn't need.
function post(id: string, pubDate: string, draft = false): CollectionEntry<'posts'> {
  return { id, data: { pubDate: new Date(pubDate), draft } } as unknown as CollectionEntry<'posts'>;
}

describe('publishedPosts', () => {
  it('sorts newest first', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-03-01'), post('c', '2026-02-01')];
    expect(publishedPosts(posts).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('excludes drafts by default', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-01-02', true)];
    expect(publishedPosts(posts).map((p) => p.id)).toEqual(['a']);
  });

  it('includes drafts when includeDrafts is true', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-01-02', true)];
    expect(publishedPosts(posts, { includeDrafts: true }).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('breaks ties on the same date stably, by id', () => {
    const posts = [post('z', '2026-01-01'), post('a', '2026-01-01'), post('m', '2026-01-01')];
    expect(publishedPosts(posts).map((p) => p.id)).toEqual(['a', 'm', 'z']);
  });

  it('returns an empty array when there are no published posts', () => {
    expect(publishedPosts([post('a', '2026-01-01', true)])).toEqual([]);
  });
});

describe('totalPages', () => {
  it('is 1 page for zero items (never zero pages)', () => {
    expect(totalPages(0)).toBe(1);
  });

  it('is 1 page when items exactly fill one page', () => {
    expect(totalPages(10, 10)).toBe(1);
  });

  it('rounds up to a second page for one extra item', () => {
    expect(totalPages(11, 10)).toBe(2);
  });

  it('computes multiple pages correctly', () => {
    expect(totalPages(25, 10)).toBe(3);
  });

  it('respects a custom page size', () => {
    expect(totalPages(9, 4)).toBe(3);
  });
});

describe('pageHref', () => {
  it('points page 1 at the site root, not /page/1', () => {
    expect(pageHref(1)).toBe('/');
  });

  it('points every other page at /page/N', () => {
    expect(pageHref(2)).toBe('/page/2');
    expect(pageHref(7)).toBe('/page/7');
  });
});
