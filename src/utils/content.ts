import type { CollectionEntry } from 'astro:content';

export type AnyPost = CollectionEntry<'writeups'> | CollectionEntry<'research'>;

export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function postPath(post: AnyPost) {
  const prefix = post.collection === 'research' ? 'research' : 'ctf';
  return withBase(`/${prefix}/${post.id}`);
}

export function sortPosts(posts: AnyPost[]) {
  return [...posts].sort(
    (a, b) =>
      b.data.updated.getTime() - a.data.updated.getTime() ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function labelForKind(kind: AnyPost['data']['kind']) {
  return {
    writeup: 'Writeup',
    'field-note': 'Field notes',
    article: 'Deep dive',
    research: 'Research',
  }[kind];
}

export function labelForStatus(status: AnyPost['data']['status']) {
  return {
    solved: 'Solved',
    partial: 'In progress',
    reference: 'Reference',
  }[status];
}
