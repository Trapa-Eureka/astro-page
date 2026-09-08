// Fixed locale + UTC — a pubDate of "2026-01-15" must render as "January 15, 2026"
// everywhere, regardless of the reader's or the build machine's system locale/timezone
// (TESTING.md §2: "fixed locale, no system dependence").
const FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return FORMATTER.format(date);
}
