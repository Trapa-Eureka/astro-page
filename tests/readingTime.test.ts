import { describe, expect, it } from 'vitest';
import { readingTime } from '../src/lib/readingTime';

describe('readingTime', () => {
  it('rounds up to a minimum of 1 minute for very short text', () => {
    expect(readingTime('a few words here')).toBe(1);
  });

  it('returns 1 minute for zero words', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('   ')).toBe(1);
  });

  it('computes a longer estimate for long text', () => {
    const longText = Array(920).fill('word').join(' '); // 920 / 230 = 4 min
    expect(readingTime(longText)).toBe(4);
  });

  it('counts words inside code blocks like any other text (no special weighting)', () => {
    const withCode = `${'word '.repeat(229)}\n\`\`\`js\nconst x = 1;\n\`\`\``;
    // 229 prose words + a handful of code-fence tokens, still under 230 → rounds to 1.
    expect(readingTime(withCode)).toBe(1);
  });

  it('respects a custom words-per-minute rate', () => {
    const text = Array(100).fill('word').join(' ');
    expect(readingTime(text, 50)).toBe(2);
  });
});
