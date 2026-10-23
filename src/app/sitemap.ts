import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/posts';
import { collectSeries, collectTags, seriesPath, tagPath } from '@/lib/taxonomy';
import { pageCount, pagePath } from '@/lib/pagination';
import { parseDate, postSlug, siteUrl } from '@/lib/site';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const posts = await getPosts();
  const tags = collectTags(posts);
  const series = collectSeries(posts);
  const paged = Array.from({ length: pageCount(posts.length) }, (_, index) => index + 1)
    .filter((page) => page > 1)
    .map((page) => ({
      url: `${base}${pagePath(page)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/posts`, changeFrequency: 'daily', priority: 0.8 },
    ...paged,
    { url: `${base}/tags`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/archive`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/series`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${base}/projects`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/notes`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/start-here`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/now`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/reading`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/uses`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/resume`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.4 },
    ...tags.map((tag) => ({
      url: `${base}${tagPath(tag.name)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...series.map((item) => ({
      url: `${base}${seriesPath(item.name)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...posts.map((post) => {
      // Only pass lastModified when the date actually parses: Next calls toISOString() on
      // it, so a single malformed frontmatter date (e.g. 2026-02-30) would otherwise fail
      // the whole build with an error pointing at the sitemap instead of the post.
      const lastModified = parseDate(post.date);
      return {
        url: `${base}/posts/${postSlug(post)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    }),
  ];
}
