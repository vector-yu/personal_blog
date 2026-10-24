import { cache } from 'react';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import type { Locale } from '@/i18n/config';
import { client } from '@/lib/tina';

export type PageDoc = {
  title: string;
  date: string | null;
  body: TinaMarkdownContent;
};

/**
 * Read one `content/pages/*.mdx` or `content/pages-en/*.mdx` document.
 *
 * `cache()` dedupes the metadata call and the page render within one request;
 * the route pages still set `revalidate = 60` for freshness. A missing page
 * returns null (the caller decides 404); transport errors are allowed to throw
 * so they are not baked in as a permanent 404.
 */
export const getPage = cache(
  async (locale: Locale, relativePath: string): Promise<PageDoc | null> => {
    if (locale === 'en') {
      const { data } = await client.queries.pageEn({ relativePath });
      const page = data?.pageEn;
      if (!page) return null;
      return {
        title: page.title,
        date: page.date ?? null,
        body: page.body as TinaMarkdownContent,
      };
    }

    const { data } = await client.queries.page({ relativePath });
    const page = data?.page;
    if (!page) return null;
    return {
      title: page.title,
      date: page.date ?? null,
      body: page.body as TinaMarkdownContent,
    };
  }
);
