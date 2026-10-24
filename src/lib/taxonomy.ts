import type { PostListItem } from '@/components/posts/post-card';
import { localePath, type Locale } from '@/i18n/config';
import { messages } from '@/i18n/messages';
import { formatDate, parseDate, postSlug, type PostSummary } from '@/lib/site';

export type TagCount = {
  name: string;
  count: number;
};

export type SeriesCount = {
  name: string;
  count: number;
};

export type YearGroup = {
  year: string;
  posts: PostSummary[];
};

/** Unique, non-empty tags of one post, preserving order. */
export function postTags(post: Pick<PostSummary, 'tags'>): string[] {
  return [
    ...new Set(
      (post.tags ?? [])
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag): tag is string => tag.length > 0)
    ),
  ];
}

/** Turn a summary into the flattened shape the client cards need. */
export function toPostListItem(post: PostSummary, locale: Locale): PostListItem {
  const slug = postSlug(post);
  const tags = postTags(post);

  return {
    slug,
    href: localePath(locale, `/posts/${slug}`),
    title: post.title,
    dateIso: post.date,
    dateLabel: formatDate(post.date, locale),
    description: post.description,
    tags,
    tagLinks: tags.map((name) => ({
      name,
      href: localePath(locale, tagPath(name)),
    })),
  };
}

/** Tags across all posts, most-used first, then alphabetically. */
export function collectTags(posts: PostSummary[], locale: Locale = 'zh'): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of postTags(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(b.name, locale === 'zh' ? 'zh-CN' : 'en')
    );
}

/** URL form of a tag, without a locale prefix. */
export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`;
}

/** Dynamic route params arrive percent-encoded for non-ASCII tags on some hosts. */
export function decodeTagParam(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

/** Series across all posts, most-used first. Empty names are ignored. */
export function collectSeries(posts: PostSummary[], locale: Locale = 'zh'): SeriesCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const series = post.series?.trim();
    if (series) counts.set(series, (counts.get(series) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(b.name, locale === 'zh' ? 'zh-CN' : 'en')
    );
}

/** URL form of a series, without a locale prefix. */
export function seriesPath(series: string): string {
  return `/series/${encodeURIComponent(series)}`;
}

export function decodeSeriesParam(series: string): string {
  try {
    return decodeURIComponent(series);
  } catch {
    return series;
  }
}

/** Posts grouped by publication year, newest year first. */
export function groupByYear(posts: PostSummary[], locale: Locale = 'zh'): YearGroup[] {
  const groups = new Map<string, PostSummary[]>();
  const undated = messages[locale].archive.undated;

  for (const post of posts) {
    const date = parseDate(post.date);
    const year = date ? String(date.getUTCFullYear()) : undated;
    const list = groups.get(year) ?? [];
    list.push(post);
    groups.set(year, list);
  }

  return [...groups.entries()]
    .map(([year, list]) => ({ year, posts: list }))
    .sort((a, b) => {
      if (a.year === undated) return 1;
      if (b.year === undated) return -1;
      return Number(b.year) - Number(a.year);
    });
}
