import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

// TESTING.md §4 / DESIGN.md §5: dist/ inspection only — filesystem + cheerio, zero
// browser, zero network. Every scripts/verify/*.test.ts file uses these helpers rather
// than reading dist directly, so "how we walk dist" stays in one place.

export const ROOT_DIR = process.cwd();
export const DIST_DIR = join(ROOT_DIR, 'dist');
export const SRC_CONTENT_DIR = join(ROOT_DIR, 'src', 'content');

export function requireDist(): void {
  if (!existsSync(DIST_DIR)) {
    throw new Error(
      'dist/ not found. `npm run verify` inspects a production build — run `npm run build` first.',
    );
  }
}

function walk(dir: string, predicate: (name: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, predicate));
    } else if (predicate(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/** All .html files under dist/, absolute paths. */
export function listHtmlFiles(): string[] {
  requireDist();
  return walk(DIST_DIR, (name) => name.endsWith('.html'));
}

/** All files under dist/, absolute paths (for the external-origin scan, size budget, etc). */
export function listAllDistFiles(): string[] {
  requireDist();
  return walk(DIST_DIR, () => true);
}

/** Converts an absolute dist file path to its site-root-relative URL path. */
export function urlPathFor(absoluteFilePath: string): string {
  const rel = absoluteFilePath.slice(DIST_DIR.length).split('\\').join('/');
  if (rel.endsWith('/index.html')) return rel.slice(0, -'index.html'.length);
  return rel;
}

export function loadHtml(absoluteFilePath: string) {
  return load(readFileSync(absoluteFilePath, 'utf-8'));
}

export function loadXml(absoluteFilePath: string) {
  return load(readFileSync(absoluteFilePath, 'utf-8'), { xmlMode: true });
}

/**
 * Resolves an internal href (starting with "/") to the dist file it should map to, or
 * null if there's no such file. Handles directory-index routes and the query/anchor
 * parts internal links never need for file resolution.
 */
export function resolveInternalHref(href: string): string | null {
  const [pathPart] = href.split('#');
  const cleanPath = pathPart.split('?')[0];
  if (cleanPath === '/') return join(DIST_DIR, 'index.html');
  const withoutTrailingSlash = cleanPath.replace(/\/$/, '');
  const asIndexHtml = join(DIST_DIR, `${withoutTrailingSlash}/index.html`);
  if (existsSync(asIndexHtml)) return asIndexHtml;
  const asDirectFile = join(DIST_DIR, cleanPath);
  if (existsSync(asDirectFile)) return asDirectFile;
  return null;
}

/**
 * Slugs of every post whose Keystatic frontmatter has `draft: true`, derived from
 * src/content/posts/*.mdoc (regex over the frontmatter block — no YAML parser needed for
 * one boolean flag). Used to assert drafts never leak into rss.xml/sitemap.
 */
export function draftPostSlugs(): string[] {
  const postsDir = join(SRC_CONTENT_DIR, 'posts');
  if (!existsSync(postsDir)) return [];
  return readdirSync(postsDir)
    .filter((name) => name.endsWith('.mdoc'))
    .filter((name) => {
      const source = readFileSync(join(postsDir, name), 'utf-8');
      const frontmatter = source.split('---')[1] ?? '';
      return /^draft:\s*true\s*$/m.test(frontmatter);
    })
    .map((name) => name.replace(/\.mdoc$/, ''));
}
