import type { CollectionEntry } from 'astro:content';

// Single source of truth for "which posts are public and in what order" — DESIGN.md §3:
// home, tags, RSS, and sitemap all go through this, never a direct .sort()/.filter().

export function publishedPosts(
  posts: CollectionEntry<'posts'>[],
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): CollectionEntry<'posts'>[] {
  return posts
    .filter((post) => includeDrafts || !post.data.draft)
    .toSorted((a, b) => {
      const byDate = b.data.pubDate.getTime() - a.data.pubDate.getTime();
      // Stable tiebreaker for same-day posts so ordering doesn't depend on filesystem
      // iteration order (TESTING.md §2: "동일 날짜 안정 정렬").
      return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
    });
}

export function totalPages(itemCount: number, pageSize = 10): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

// Page 1 lives at "/" (SPEC.md §3: "/page/2"), so page number -> URL isn't just
// `/page/${n}` uniformly — this is the one place that boundary is encoded.
export function pageHref(pageNumber: number): string {
  return pageNumber <= 1 ? '/' : `/page/${pageNumber}`;
}
