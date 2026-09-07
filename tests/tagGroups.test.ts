import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { groupPostsByTagSlug } from '../src/lib/tagGroups';
import { tagSlug } from '../src/lib/tagSlug';

function post(id: string, tags: string[]): CollectionEntry<'posts'> {
  return { id, data: { tags } } as unknown as CollectionEntry<'posts'>;
}

describe('groupPostsByTagSlug', () => {
  it('groups posts under each of their tags', () => {
    const posts = [post('a', ['astro', 'cms']), post('b', ['astro'])];
    const groups = groupPostsByTagSlug(posts);
    expect(groups.get('astro')?.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(groups.get('cms')?.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('every group key is exactly tagSlug(rawTag) — the route and the link cannot diverge', () => {
    const rawTags = ['CI/CD', 'Design Systems', 'astro'];
    const posts = [post('a', rawTags)];
    const groups = groupPostsByTagSlug(posts);
    for (const raw of rawTags) {
      expect(groups.has(tagSlug(raw)), `expected a group keyed by tagSlug("${raw}")`).toBe(true);
    }
  });

  it('merges raw tag spellings that slugify to the same value', () => {
    const posts = [post('a', ['CI/CD']), post('b', ['ci-cd'])];
    const groups = groupPostsByTagSlug(posts);
    expect(groups.size).toBe(1);
    expect(groups.get('ci-cd')?.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('returns an empty map for posts with no tags', () => {
    expect(groupPostsByTagSlug([post('a', [])]).size).toBe(0);
  });
});
