import { config } from '@keystatic/core';

// T0: integration wiring only. The real content model (posts/authors/settings
// collections + fields) lands in T1 per docs/DESIGN.md §2.
export default config({
  storage: { kind: 'local' },
  collections: {},
});
