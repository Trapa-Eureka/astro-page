import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// T6 completion criteria: RSS goes through publishedPosts() rather than sorting/filtering
// posts itself — same source-level pattern as tests/tagRouteConsistency.test.ts, since
// src/pages/rss.xml.ts imports astro:content and can't run under plain Vitest directly
// (see src/content.schemas.ts for why).

function read(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8');
}

describe('rss.xml: sources posts via publishedPosts()', () => {
  const rssRoute = read('../src/pages/rss.xml.ts');

  it('imports publishedPosts from the shared lib', () => {
    expect(rssRoute).toMatch(/import \{ publishedPosts \} from ['"]\.\.\/lib\/postFilters['"]/);
  });

  it('calls publishedPosts() rather than sorting/filtering posts inline', () => {
    expect(rssRoute).toContain('publishedPosts(');
    expect(rssRoute).not.toMatch(/allPosts\s*\.\s*(sort|filter)\(/);
  });
});
