import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { client } from '@/lib/tina';
import { toPostSummaries } from '@/lib/site';

/**
 * All published posts for one locale, newest first, deduped per render.
 *
 * Chinese and English live in separate collections (`post` / `postEn`), so the
 * collection itself selects the language; every page must pass its locale.
 */
export const getPosts = cache(async (locale: Locale = 'zh') => {
  if (locale === 'en') {
    const { data } = await client.queries.postEnConnection();
    return toPostSummaries(data?.postEnConnection?.edges);
  }
  const { data } = await client.queries.postConnection();
  return toPostSummaries(data?.postConnection?.edges);
});

/**
 * One post document in the given locale, with the generated query/variables kept
 * for `useTina` in the visual editor.
 *
 * Returns null when the translation does not exist; callers decide whether to
 * fall back (a scoped redirect) or 404.
 */
export const getPostResult = cache(
  async (locale: Locale, relativePath: string) => {
    if (locale === 'en') {
      return await client.queries.postEn({ relativePath });
    }
    return await client.queries.post({ relativePath });
  }
);

export const getPost = cache(async (locale: Locale, relativePath: string) => {
  if (locale === 'en') {
    const { data } = await client.queries.postEn({ relativePath });
    return data?.postEn ?? null;
  }
  const { data } = await client.queries.post({ relativePath });
  return data?.post ?? null;
});
