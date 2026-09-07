import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// T5 completion criteria: the tag route and every tag link go through the same
// normalization function, so a tag rendered as a link always has a matching route.
// groupPostsByTagSlug()'s own tests prove the grouping logic keys by tagSlug()
// correctly; this proves the actual page files call that shared code rather than
// re-implementing slugification inline (the drift TASKS.md is guarding against).

function read(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8');
}

describe('tag slug: route generation and links use the same function', () => {
  const tagRoute = read('../src/pages/tags/[tag].astro');
  const postDetail = read('../src/pages/posts/[slug].astro');

  it('/tags/[tag] generates routes via groupPostsByTagSlug (which keys by tagSlug)', () => {
    expect(tagRoute).toMatch(
      /import \{ groupPostsByTagSlug \} from ['"]\.\.\/\.\.\/lib\/tagGroups['"]/,
    );
    expect(tagRoute).toContain('groupPostsByTagSlug(');
  });

  it('post detail tag links use tagSlug() from the shared lib, not an inline transform', () => {
    expect(postDetail).toMatch(/import \{ tagSlug \} from ['"]\.\.\/\.\.\/lib\/tagSlug['"]/);
    expect(postDetail).toMatch(/tagSlug\(tag\)/);
  });
});
