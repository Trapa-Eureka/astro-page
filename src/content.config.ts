import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { postShape, authorShape, settingsShape, withCoverAltRefine } from './content.schemas';

// Consuming schema for content Keystatic writes. Field keys/required-ness here must stay
// in lockstep with keystatic.config.ts — tests/content-parity.test.ts is the drift gate.
// The zod shapes themselves live in content.schemas.ts (see there for why).

const posts = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: 'src/content/posts' }),
  schema: withCoverAltRefine(
    z.object({ ...postShape, authors: z.array(reference('authors')).min(1) }),
  ),
});

const authors = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'src/content/authors' }),
  schema: z.object(authorShape),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'src/content/settings' }),
  schema: z.object(settingsShape),
});

export const collections = { posts, authors, settings };
