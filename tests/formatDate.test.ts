import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/lib/formatDate';

describe('formatDate', () => {
  it('formats a fixed date to a fixed string, independent of system locale/timezone', () => {
    expect(formatDate(new Date('2026-01-15'))).toBe('January 15, 2026');
  });

  it('formats single-digit days without zero-padding', () => {
    expect(formatDate(new Date('2026-03-05'))).toBe('March 5, 2026');
  });

  it('formats year boundaries correctly', () => {
    expect(formatDate(new Date('2025-12-31'))).toBe('December 31, 2025');
  });
});
