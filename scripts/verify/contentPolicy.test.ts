import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listAllDistFiles, ROOT_DIR } from './helpers';

// TESTING.md §4 "콘텐츠 정책": no trace of the layout reference anywhere in dist or in
// authored content (CLAUDE.md guardrail 1). Grep-shaped, case-insensitive.

const FORBIDDEN_STRINGS = ['theguardian', 'guardian egyptian', 'guardian headline'];
const TEXT_EXTENSIONS = new Set([
  '.html',
  '.xml',
  '.css',
  '.mdoc',
  '.yaml',
  '.yml',
  '.md',
  '.ts',
  '.astro',
]);

function listFilesRecursively(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function scan(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(extname(file))) continue;
    const text = readFileSync(file, 'utf-8').toLowerCase();
    for (const forbidden of FORBIDDEN_STRINGS) {
      if (text.includes(forbidden))
        hits.push(`${relative(ROOT_DIR, file)}: contains "${forbidden}"`);
    }
  }
  return hits;
}

describe('forbidden reference-site strings', () => {
  it('are absent from dist/', () => {
    const hits = scan(listAllDistFiles());
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('are absent from src/content/', () => {
    const contentDir = join(ROOT_DIR, 'src', 'content');
    const hits = statSync(contentDir, { throwIfNoEntry: false })
      ? scan(listFilesRecursively(contentDir))
      : [];
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
