// Normalizes a tag into a stable, kebab-case, unicode-friendly slug — the one function
// both /tags/[tag] (route generation, T5) and every tag link (T4, T5) must go through,
// or a tag typed slightly differently in two places silently produces two different URLs.
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
