import type { PostListItem } from '@/components/posts/post-card';
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
export function toPostListItem(post: PostSummary): PostListItem {
  return {
    slug: postSlug(post),
    title: post.title,
    dateIso: post.date,
    dateLabel: formatDate(post.date),
    description: post.description,
    tags: postTags(post),
  };
}

/** Tags across all posts, most-used first, then alphabetically. */
export function collectTags(posts: PostSummary[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of postTags(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

/** URL form of a tag. Tags are user content, so they must be encoded. */
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
export function collectSeries(posts: PostSummary[]): SeriesCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const series = post.series?.trim();
    if (series) counts.set(series, (counts.get(series) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

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
export function groupByYear(posts: PostSummary[]): YearGroup[] {
  const groups = new Map<string, PostSummary[]>();

  for (const post of posts) {
    const date = parseDate(post.date);
    const year = date ? String(date.getUTCFullYear()) : '未标注日期';
    const list = groups.get(year) ?? [];
    list.push(post);
    groups.set(year, list);
  }

  return [...groups.entries()]
    .map(([year, list]) => ({ year, posts: list }))
    .sort((a, b) => {
      if (a.year === '未标注日期') return 1;
      if (b.year === '未标注日期') return -1;
      return Number(b.year) - Number(a.year);
    });
}
