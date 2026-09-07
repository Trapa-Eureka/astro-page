// Word count / wpm, nothing smarter — see the "A Field Guide to Reading Time
// Estimates" seed post for why we didn't weight code blocks differently.
const WORDS_PER_MINUTE = 230;

export function readingTime(source: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  // A 40-word post rounding to "0 min read" reads as a bug, not an insight — floor of 1.
  return Math.max(1, Math.round(words / wordsPerMinute));
}
