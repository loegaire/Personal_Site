import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortPosts } from '../utils/content';

export async function GET(context) {
  const posts = sortPosts([
    ...(await getCollection('writeups')),
    ...(await getCollection('research')),
  ]);

  return rss({
    title: 'Field Archive',
    description: 'A personal collection of CTF writeups, field notes, and academic research.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.updated,
      link: `${post.collection === 'research' ? 'research' : 'ctf'}/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
