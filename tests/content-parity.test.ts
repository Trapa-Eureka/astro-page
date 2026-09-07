import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import keystaticConfig from '../keystatic.config';
import { authorShape, postShape, settingsShape, withCoverAltRefine } from '../src/content.schemas';

// Drift gate for docs/DESIGN.md §2's dual schema (Keystatic writes content.config.ts reads).
// Keystatic's own runtime field objects don't expose a uniform, reliable "kind"/"required"
// signal across field types in the installed @keystatic/core version (verified by hand
// while building this test — e.g. every BasicFormField, text() included, reports
// `formKind: 'slug'`), so this test avoids relying on that and instead:
// 1. compares plain field-key sets (100% reliable — Object.keys on both configs' schemas)
// 2. exercises each field's own public `validate()` — the one contract every Keystatic
//    field kind actually implements — to determine required-ness, rather than reading
//    internal shape.

type KeystaticField = {
  kind: string;
  validate?: (value: unknown) => unknown;
  validation?: { length?: { min?: number } };
};

// content.config.ts's `content` field is Keystatic's markdoc contentField (the post body).
// It isn't part of the zod `data` shape — Astro's loader exposes it separately as
// entry.body/rendered — so every comparison below excludes it.
const CONTENT_FIELD_KEYS = new Set(['content']);

function keystaticFieldKeys(schema: Record<string, unknown>): Set<string> {
  return new Set(Object.keys(schema).filter((key) => !CONTENT_FIELD_KEYS.has(key)));
}

function zodShapeKeys(shape: Record<string, unknown>): Set<string> {
  return new Set(Object.keys(shape));
}

// Fields whose required-ness this test verifies scalar-by-scalar, and how to probe each
// Keystatic field for it. slugField keys (title/name) are structurally required — Keystatic
// won't create an entry without them — so they're intentionally absent here. `draft` is a
// checkbox with a default; "required" isn't a meaningful question for it. `authors`/`tags`
// are arrays, checked separately below (their `validation` is a plain readable property,
// unlike scalar fields — see the array() factory).
const SCALAR_PROBE: Record<string, 'text' | 'date' | 'asset'> = {
  excerpt: 'text',
  pubDate: 'date',
  cover: 'asset',
  coverAlt: 'text',
  role: 'text',
  bio: 'text',
  siteTitle: 'text',
  description: 'text',
  footerNote: 'text',
};

// text fields treat '' as empty; date/asset fields treat exactly `null` as empty
// (see @keystatic/core's validateText and assertRequired respectively).
function keystaticFieldRequired(field: KeystaticField, probe: 'text' | 'date' | 'asset'): boolean {
  const emptyValue = probe === 'text' ? '' : null;
  try {
    field.validate?.(emptyValue);
    return false;
  } catch {
    return true;
  }
}

function zodFieldRequired(fieldSchema: z.ZodType): boolean {
  return !fieldSchema.safeParse(undefined).success;
}

function assertScalarRequirednessMatches(
  keystaticSchema: Record<string, KeystaticField>,
  zodShape: Record<string, z.ZodType>,
) {
  for (const [key, probe] of Object.entries(SCALAR_PROBE)) {
    if (!(key in keystaticSchema) || !(key in zodShape)) continue;
    const keystaticRequired = keystaticFieldRequired(keystaticSchema[key], probe);
    const zodRequired = zodFieldRequired(zodShape[key]);
    expect(
      keystaticRequired,
      `${key}: keystatic required=${keystaticRequired}, zod required=${zodRequired}`,
    ).toBe(zodRequired);
  }
}

const postsSchema = keystaticConfig.collections?.posts.schema as unknown as Record<
  string,
  KeystaticField
>;
const authorsSchema = keystaticConfig.collections?.authors.schema as unknown as Record<
  string,
  KeystaticField
>;
const settingsSchema = keystaticConfig.singletons?.settings.schema as unknown as Record<
  string,
  KeystaticField
>;

describe('content model parity: keystatic.config.ts <-> src/content.schemas.ts', () => {
  it('posts: field keys match', () => {
    expect(keystaticFieldKeys(postsSchema)).toEqual(zodShapeKeys(postShape));
  });

  it('authors: field keys match', () => {
    expect(keystaticFieldKeys(authorsSchema)).toEqual(zodShapeKeys(authorShape));
  });

  it('settings: field keys match', () => {
    expect(keystaticFieldKeys(settingsSchema)).toEqual(zodShapeKeys(settingsShape));
  });

  // Negative case (TASKS.md T1): prove the key-set check actually fails when a field
  // exists on only one side, so the passing assertions above aren't a no-op comparison.
  it('detects drift when a field is missing from one side', () => {
    const postsKeysMissingExcerpt = new Set(keystaticFieldKeys(postsSchema));
    postsKeysMissingExcerpt.delete('excerpt');
    expect(postsKeysMissingExcerpt).not.toEqual(zodShapeKeys(postShape));

    const zodKeysWithExtraField = new Set(zodShapeKeys(authorShape));
    zodKeysWithExtraField.add('socialLinks');
    expect(keystaticFieldKeys(authorsSchema)).not.toEqual(zodKeysWithExtraField);
  });

  it('posts: scalar field required-ness matches', () => {
    assertScalarRequirednessMatches(postsSchema, postShape);
  });

  it('authors: scalar field required-ness matches', () => {
    assertScalarRequirednessMatches(authorsSchema, authorShape);
  });

  it('settings: scalar field required-ness matches', () => {
    assertScalarRequirednessMatches(settingsSchema, settingsShape);
  });

  it('posts.authors: both sides require at least one author', () => {
    expect(postsSchema.authors.validation?.length?.min).toBe(1);
    expect(postShape.authors.safeParse([]).success).toBe(false);
    expect(postShape.authors.safeParse(['dax-oduya']).success).toBe(true);
  });

  it('posts.tags: neither side requires a minimum tag count', () => {
    expect(postsSchema.tags.validation?.length?.min ?? 0).toBe(0);
    expect(postShape.tags.safeParse([]).success).toBe(true);
  });
});

describe('cover/coverAlt refine (DESIGN.md §2: cover set requires coverAlt)', () => {
  const schema = withCoverAltRefine(
    z.object({
      authors: postShape.authors,
      tags: postShape.tags,
      cover: postShape.cover,
      coverAlt: postShape.coverAlt,
    }),
  );

  it('rejects a cover without coverAlt', () => {
    const result = schema.safeParse({
      tags: [],
      authors: ['a'],
      cover: '/posts-images/x/cover.png',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['coverAlt']);
    }
  });

  it('accepts a cover with coverAlt', () => {
    const result = schema.safeParse({
      tags: [],
      authors: ['a'],
      cover: '/posts-images/x/cover.png',
      coverAlt: 'Descriptive alt text',
    });
    expect(result.success).toBe(true);
  });

  it('accepts no cover and no coverAlt', () => {
    const result = schema.safeParse({ tags: [], authors: ['a'] });
    expect(result.success).toBe(true);
  });
});
