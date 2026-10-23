import { cache } from 'react';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import { client } from '@/lib/tina';

export type PageDoc = {
  title: string;
  date: string | null;
  body: TinaMarkdownContent;
};

/**
 * Read one `content/pages/*.mdx` document by relative path.
 *
 * `cache()` dedupes the metadata call and the page render within one request;
 * the route pages still set `revalidate = 60` for freshness. A missing page
 * returns null (the caller decides 404); transport errors are allowed to throw
 * so they are not baked in as a permanent 404.
 */
export const getPage = cache(async (relativePath: string): Promise<PageDoc | null> => {
  const { data } = await client.queries.page({ relativePath });
  const page = data?.page;

  if (!page) return null;

  return {
    title: page.title,
    date: page.date ?? null,
    body: page.body as TinaMarkdownContent,
  };
});
