import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { publishedPosts } from '../lib/postFilters';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('posts');
  const posts = publishedPosts(allPosts);

  return rss({
    title: 'Makinilya Engineering',
    description:
      'Notes on building and maintaining web software, from the engineers at Makinilya Studio.',
    site: context.site ?? new URL('https://makinilya-engineering.example'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
