import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// T2 completion criteria: BaseLayout has landmarks + a skip link. This checks the
// component source directly rather than rendering (astro:content, which Header/Footer
// use, only resolves inside Astro's own Vite pipeline — see src/content.schemas.ts for
// why the same constraint shows up in the parity test). The full rendered-output version
// of this check is TESTING.md §4's verify suite (T7), run against the real dist/ build —
// this test just guards against an obvious regression (e.g. someone deletes the skip
// link) showing up between now and then.

function read(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8');
}

describe('BaseLayout: landmarks + skip link', () => {
  const layout = read('../src/layouts/BaseLayout.astro');
  const header = read('../src/components/Header.astro');
  const footer = read('../src/components/Footer.astro');

  it('has a skip link targeting #main-content', () => {
    expect(layout).toMatch(/<a href="#main-content" class="skip-link">/);
  });

  it('has a <main> landmark with the matching id', () => {
    expect(layout).toMatch(/<main id="main-content">/);
  });

  it('renders Header and Footer components (header/footer landmarks)', () => {
    expect(layout).toMatch(/<Header\s*\/>/);
    expect(layout).toMatch(/<Footer\s*\/>/);
  });

  it('Header renders a <header> element', () => {
    expect(header).toMatch(/<header[\s>]/);
  });

  it('Footer renders a <footer> element', () => {
    expect(footer).toMatch(/<footer[\s>]/);
  });

  it('declares a single h1-worthy page <title> slot via required props', () => {
    expect(layout).toContain('title: string');
    expect(layout).toMatch(/<title>\{title\}<\/title>/);
  });
});
