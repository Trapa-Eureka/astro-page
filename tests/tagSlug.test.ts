import { describe, expect, it } from 'vitest';
import { tagSlug } from '../src/lib/tagSlug';

describe('tagSlug', () => {
  it('lowercases', () => {
    expect(tagSlug('CMS')).toBe('cms');
  });

  it('kebab-cases spaces', () => {
    expect(tagSlug('Design Systems')).toBe('design-systems');
  });

  it('kebab-cases special characters', () => {
    expect(tagSlug('CI/CD')).toBe('ci-cd');
  });

  it('trims leading/trailing separators', () => {
    expect(tagSlug('  spaced out  ')).toBe('spaced-out');
    expect(tagSlug('--wrapped--')).toBe('wrapped');
  });

  it('collapses consecutive special characters into one hyphen', () => {
    expect(tagSlug('a!!  --__b')).toBe('a-b');
  });

  it('keeps unicode letters (does not transliterate to ASCII)', () => {
    expect(tagSlug('Café')).toBe('café');
  });

  it('is idempotent — slugifying an already-slugified tag is a no-op', () => {
    const slug = tagSlug('Design Systems & CSS');
    expect(tagSlug(slug)).toBe(slug);
  });
});
