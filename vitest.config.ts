import { defineConfig } from 'vitest/config';

// Two projects share one config:
// - "unit": pure-function + schema-parity tests (tests/) — part of `npm run check`.
// - "verify": dist inspection suite (scripts/verify/, DESIGN.md §5) — runs only after a
//   build, via `npm run verify`. Both are allowed to have zero test files until later
//   tasks (T1, T7) populate them.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'verify',
          include: ['scripts/verify/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
