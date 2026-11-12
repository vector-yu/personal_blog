import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { localePath } from '@/i18n/config';
import { seriesPath } from '@/lib/taxonomy';
import { client } from '@/lib/tina';
import { toPostSummaries } from '@/lib/site';
import {
  groupPostsByWeek,
  isWeeklySeries,
  WEEKLY_SERIES,
  WEEKLY_SERIES_EN,
} from '@/lib/weeks';

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
 * Posts for the public writing surfaces: `/posts`, `/tags`, `/archive` and the
 * RSS feed. The daily-problem series is deliberately excluded there — it has its
 * own week hub and would otherwise dominate the archive and tag list.
 *
 * Series and individual post pages keep using `getPosts` so the daily posts stay
 * reachable and indexed.
 */
export const getEditorialPosts = cache(async (locale: Locale = 'zh') => {
  const posts = await getPosts(locale);
  return posts.filter((post) => !isWeeklySeries(post.series));
});

export type DailyProblemSummary = {
  count: number;
  weeks: number;
  latestWeek: number | null;
  latestWeekYear: number | null;
  href: string;
};

/** Compact stats for the entry card shown at the top of `/posts`. */
export const getDailyProblemSummary = cache(
  async (locale: Locale = 'zh'): Promise<DailyProblemSummary> => {
    const posts = await getPosts(locale);
    const daily = posts.filter((post) => isWeeklySeries(post.series));
    const weeks = groupPostsByWeek(daily);
    const latest = weeks[0];

    return {
      count: daily.length,
      weeks: weeks.length,
      latestWeek: latest?.week ?? null,
      latestWeekYear: latest?.weekYear ?? null,
      href: localePath(
        locale,
        seriesPath(locale === 'zh' ? WEEKLY_SERIES : WEEKLY_SERIES_EN)
      ),
    };
  }
);

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
