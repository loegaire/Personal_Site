import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  site: 'https://loegaire.github.io/Personal_Site/',
  base: '/Personal_Site',
  output: 'static',
  redirects: {
    '/ctf/ndias-automotive-suspicious-device':
      '/Personal_Site/ctf/ndias-ndias-automotive-iot-ctf-suspicious-device-suspicious-device-1',
  },
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        [rehypeKatex, { strict: false, throwOnError: false }],
      ],
    }),
    shikiConfig: {
      theme: 'vesper',
      wrap: true,
    },
  },
});
