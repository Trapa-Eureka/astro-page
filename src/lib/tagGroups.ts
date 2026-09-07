import type { CollectionEntry } from 'astro:content';
import { tagSlug } from './tagSlug';

export interface TagGroup {
  slug: string;
  label: string;
  posts: CollectionEntry<'posts'>[];
}

// Groups posts by tag slug (via tagSlug — the same function post detail pages use to link
// to /tags/[tag], so a route always exists for every tag link and vice versa). Two raw tag
// spellings that slugify to the same value (e.g. "CI/CD" and "ci-cd") merge into one group;
// the label shown is whichever spelling was seen first.
export function groupPostsByTagSlug(posts: CollectionEntry<'posts'>[]): Map<string, TagGroup> {
  const groups = new Map<string, TagGroup>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      const group = groups.get(slug);
      if (group) {
        group.posts.push(post);
      } else {
        groups.set(slug, { slug, label: tag, posts: [post] });
      }
    }
  }
  return groups;
}
