// @ts-check
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import shiki from '@astrojs/markdoc/shiki';

// One Shiki theme for code blocks (DESIGN.md §5) — @astrojs/markdoc doesn't wire this up
// by default, it has to be added as an extension.
export default defineMarkdocConfig({
  extends: [shiki({ theme: 'github-dark' })],
});
