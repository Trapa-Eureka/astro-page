import { z } from 'astro/zod';

// Zod field shapes, kept separate from src/content.config.ts so tests/content-parity.test.ts
// can import them without going through the `astro:content` virtual module (which only
// resolves inside Astro's own Vite pipeline, not plain Vitest). content.config.ts imports
// these too, swapping `authors` for a real astro:content reference() — see there.
//
// docs/DESIGN.md §2 is the source of truth for this table; keystatic.config.ts must match.

export const postShape = {
  title: z.string(),
  excerpt: z.string().min(1).max(200),
  pubDate: z.coerce.date(),
  // Placeholder shape for parity/unit testing — content.config.ts overrides this with
  // z.array(reference('authors')).min(1) for the real astro:content-aware version.
  authors: z.array(z.string()).min(1),
  tags: z.array(z.string()),
  // Public URL string, not Astro's image() helper — see docs/DESIGN.md §2 note on why.
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  draft: z.boolean().default(false),
};

interface CoverFields {
  cover?: string;
  coverAlt?: string;
}

export function withCoverAltRefine<Schema extends z.ZodType<CoverFields>>(schema: Schema) {
  return schema.refine((post) => !post.cover || Boolean(post.coverAlt?.length), {
    message: 'coverAlt is required when cover is set — add alt text describing the cover image.',
    path: ['coverAlt'],
  });
}

export const authorShape = {
  name: z.string(),
  role: z.string().min(1),
  bio: z.string().min(1).max(300),
};

export const settingsShape = {
  siteTitle: z.string().min(1),
  description: z.string().min(1),
  footerNote: z.string().min(1),
};
