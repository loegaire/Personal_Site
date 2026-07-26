import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

function contentId(entry: string) {
  return entry
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/^(?:imported|local)\//, '')
    .split('/')
    .map((segment) =>
      segment
        .normalize('NFKD')
        .replace(/[^\x00-\x7F]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('/');
}

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  published: z.coerce.date(),
  updated: z.coerce.date(),
  event: z.string(),
  category: z.string(),
  kind: z.enum(['writeup', 'field-note', 'article', 'research']),
  status: z.enum(['solved', 'partial', 'reference']),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().int().positive(),
  wordCount: z.number().int().nonnegative(),
  featured: z.boolean().default(false),
  sourcePath: z.string().optional(),
  attachment: z.string().optional(),
});

const writeups = defineCollection({
  loader: glob({
    base: './src/content/writeups',
    pattern: '**/*.md',
    generateId: ({ entry }) => contentId(entry),
  }),
  schema: postSchema,
});

const research = defineCollection({
  loader: glob({
    base: './src/content/research',
    pattern: '**/*.md',
    generateId: ({ entry }) => contentId(entry),
  }),
  schema: postSchema,
});

export const collections = { writeups, research };
