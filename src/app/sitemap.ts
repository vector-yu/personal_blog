import type { MetadataRoute } from 'next';
import { localePath } from '@/i18n/config';
import { getHomeContent } from '@/lib/home';
import { getPosts } from '@/lib/posts';
import { collectSeries, collectTags, seriesPath, tagPath } from '@/lib/taxonomy';
import { pageCount, pagePath } from '@/lib/pagination';
import { parseDate, postSlug, siteUrl } from '@/lib/site';

export const revalidate = 60;

const STATIC_PATHS = [
  '/',
  '/posts',
  '/tags',
  '/archive',
  '/series',
  '/projects',
  '/notes',
  '/start-here',
  '/reading',
  '/about',
];

/** Language alternates for a path that exists in both locales. */
function languageAlternates(path: string) {
  return {
    languages: {
      'zh-CN': `${siteUrl()}${localePath('zh', path)}`,
      en: `${siteUrl()}${localePath('en', path)}`,
      'x-default': `${siteUrl()}${localePath('zh', path)}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [zhPosts, enPosts] = await Promise.all([getPosts('zh'), getPosts('en')]);
  const homes = {
    zh: await getHomeContent('zh'),
    en: await getHomeContent('en'),
  };
  const zhSlugs = new Set(zhPosts.map((post) => postSlug(post)));
  const enSlugs = new Set(enPosts.map((post) => postSlug(post)));

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ['zh', 'en'] as const) {
    const posts = locale === 'zh' ? zhPosts : enPosts;
    const otherSlugs = locale === 'zh' ? enSlugs : zhSlugs;
    // Hidden pages are not advertised to crawlers either.
    const paths = STATIC_PATHS.filter((path) => path !== '/reading' || homes[locale].showReading);

    for (const path of paths) {
      entries.push({
        url: `${base}${localePath(locale, path)}`,
        changeFrequency: path === '/' || path === '/posts' ? 'daily' : 'monthly',
        priority: path === '/' ? 1 : path === '/posts' ? 0.8 : 0.5,
        alternates: languageAlternates(path),
      });
    }

    // Paged lists: page counts can differ between languages, so only self-alternate.
    for (let page = 2; page <= pageCount(posts.length); page += 1) {
      const path = pagePath(page, locale);
      entries.push({
        url: `${base}${path}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    for (const tag of collectTags(posts, locale)) {
      entries.push({
        url: `${base}${localePath(locale, tagPath(tag.name))}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      });
    }

    for (const item of collectSeries(posts, locale)) {
      entries.push({
        url: `${base}${localePath(locale, seriesPath(item.name))}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      });
    }

    for (const post of posts) {
      const slug = postSlug(post);
      const lastModified = parseDate(post.date);
      entries.push({
        url: `${base}${localePath(locale, `/posts/${slug}`)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'weekly',
        priority: 0.7,
        // Only advertise the other language when the translation exists.
        ...(otherSlugs.has(slug)
          ? {
              alternates: {
                languages: {
                  'zh-CN': `${base}${localePath('zh', `/posts/${slug}`)}`,
                  en: `${base}${localePath('en', `/posts/${slug}`)}`,
                  'x-default': `${base}${localePath('zh', `/posts/${slug}`)}`,
                },
              },
            }
          : {}),
      });
    }
  }

  return entries;
}
