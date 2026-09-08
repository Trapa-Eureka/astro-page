import { config, fields, collection, singleton } from '@keystatic/core';
import type { Config } from '@keystatic/core';

// Content model — docs/DESIGN.md §2 is the source of truth. Field keys/required-ness here
// must stay in lockstep with src/content.config.ts (zod); tests/content-parity.test.ts is
// the drift gate.

// GitHub mode in production (Vercel) so /keystatic works on the deployed site; local mode
// when developing locally, so `npm run dev` keeps working exactly like before (direct file
// writes, no OAuth needed) — see docs/EVAL-KEYSTATIC.md.
//
// This file is bundled into the *browser* as well as the server (the admin UI needs the
// schema client-side), so the switch can't read `process.env` directly — `process` isn't
// defined in a browser bundle (confirmed: caused a real hydration crash, "process is not
// defined", when tested). `import.meta.env` is Vite's isomorphic env access; only
// PUBLIC_-prefixed vars are ever exposed to the client bundle, so the actual OAuth
// client-id/secret stay server-only — PUBLIC_KEYSTATIC_STORAGE is a dedicated, non-secret
// flag set alongside the real secrets in Vercel (see .env.example).
const storage: Config['storage'] =
  import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
    ? { kind: 'github', repo: { owner: 'Trapa-Eureka', name: 'astro-page' } }
    : { kind: 'local' };

export default config({
  storage,
  collections: {
    posts: collection({
      label: 'Posts',
      path: 'src/content/posts/*',
      slugField: 'title',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({
          label: 'Excerpt',
          description: 'Shown on the home list and as the meta description (≤200 chars).',
          multiline: true,
          validation: { length: { min: 1, max: 200 } },
        }),
        pubDate: fields.date({ label: 'Publish date', validation: { isRequired: true } }),
        authors: fields.array(fields.relationship({ label: 'Author', collection: 'authors' }), {
          label: 'Authors',
          itemLabel: (props) => props.value ?? 'Choose an author',
          validation: { length: { min: 1 } },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        cover: fields.image({
          label: 'Cover image',
          description: 'Optional. If set, Cover alt text below becomes required.',
          // Lives under public/ (not src/content/) because Keystatic's image field writes
          // the frontmatter value as a public URL path (verified: "/posts-images/<slug>/
          // cover.png"), not a path relative to the entry file — so it can't feed Astro's
          // content-collection image() helper (which expects a Vite-importable relative
          // path). A plain public/ file + z.string() in content.config.ts is the direct fit.
          directory: 'public/posts-images',
          publicPath: '/posts-images/',
          validation: { isRequired: false },
        }),
        coverAlt: fields.text({
          label: 'Cover alt text',
          description: 'Required whenever a cover image is set.',
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    authors: collection({
      label: 'Authors',
      path: 'src/content/authors/*',
      slugField: 'name',
      format: 'yaml',
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role', validation: { length: { min: 1 } } }),
        bio: fields.text({
          label: 'Bio',
          multiline: true,
          validation: { length: { min: 1, max: 300 } },
        }),
      },
    }),
  },
  singletons: {
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings/site',
      format: 'yaml',
      schema: {
        siteTitle: fields.text({ label: 'Site title', validation: { length: { min: 1 } } }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { length: { min: 1 } },
        }),
        footerNote: fields.text({ label: 'Footer note', validation: { length: { min: 1 } } }),
      },
    }),
  },
});
