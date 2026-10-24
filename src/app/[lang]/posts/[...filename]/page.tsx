import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import PostClient from './post-client';
import type { PostRef } from '@/components/posts/post-ref';
import { htmlLang, localePath, otherLocale } from '@/i18n/config';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getHomeContent } from '@/lib/home';
import { getPost, getPostResult, getPosts } from '@/lib/posts';
import {
  formatDate,
  parseDate,
  postSlug,
  siteUrl,
  type PostSummary,
} from '@/lib/site';
import { postTags, tagPath } from '@/lib/taxonomy';
import { estimateReadingMinutes, extractHeadings } from '@/lib/toc';
import type { PostEnQuery, PostQuery } from '@/tina/__generated__/types';

/**
 * Catch-all (`[...filename]`) rather than a single segment (`[filename]`), so
 * posts in subfolders work: `content/posts/2026/new-post.mdx` is served at
 * `/zh/posts/2026/new-post`.
 */
type Params = { filename: string[] };

export const revalidate = 60;

/** Route segments -> the path used to look the document up in the collection. */
function toRelativePath(segments: string[]) {
  const slug = segments.join('/');
  return slug.endsWith('.mdx') || slug.endsWith('.md') ? slug : `${slug}.mdx`;
}

function isPublished(node: { draft: boolean | null } | null | undefined) {
  return Boolean(node) && !node?.draft;
}

function toRef(post: PostSummary, locale: 'zh' | 'en'): PostRef {
  return {
    slug: postSlug(post),
    href: localePath(locale, `/posts/${postSlug(post)}`),
    title: post.title,
    dateLabel: formatDate(post.date, locale),
    tags: postTags(post),
  };
}

/**
 * Pre-render every published post in the current locale.
 *
 * Uses `_sys.relativePath` (not `filename`, which is only the basename) so
 * subfolders resolve, and excludes drafts so `draft: true` really does
 * unpublish a post rather than only hiding it from lists.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const locale = await getLocale();
  const posts = await getPosts(locale);
  return posts.map((post) => ({
    filename: post.relativePath.replace(/\.mdx?$/, '').split('/'),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const { filename } = await params;
  const relativePath = toRelativePath(filename);

  try {
    const post = await getPost(locale, relativePath);
    if (!isPublished(post) || !post) return { title: messages.post.notFoundTitle };

    const [home, other] = await Promise.all([
      getHomeContent(locale),
      getPost(otherLocale(locale), relativePath),
    ]);

    const image = post.cover ?? '/opengraph-image';
    const published = parseDate(post.date)?.toISOString();

    return buildMetadata({
      locale,
      path: `/posts/${filename.join('/')}`,
      title: post.title,
      description: post.description ?? undefined,
      siteName: home.siteName,
      image,
      type: 'article',
      publishedTime: published,
      translated: isPublished(other),
    });
  } catch {
    // A transport-level failure (offline, DNS) must not be reported as "not found".
    return { title: messages.post.unavailableTitle };
  }
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const { filename } = await params;
  const relativePath = toRelativePath(filename);

  let result: Awaited<ReturnType<typeof getPostResult>>;
  try {
    result = await getPostResult(locale, relativePath);
  } catch (error) {
    console.error(`Failed to load post "${relativePath}" (${locale}):`, error);
    throw error;
  }

  const post =
    locale === 'en'
      ? (result.data as PostEnQuery | undefined)?.postEn
      : (result.data as PostQuery | undefined)?.post;

  if (!post || post.draft) {
    // An untranslated English post falls back to the English list rather than
    // 404ing on a link the language switch just produced.
    if (locale === 'en') {
      const chinese = await getPost('zh', relativePath);
      if (isPublished(chinese)) redirect(localePath('en', '/posts'));
    }
    notFound();
  }

  const slug = postSlug({ relativePath: post._sys.relativePath });

  const [posts, home] = await Promise.all([getPosts(locale), getHomeContent(locale)]);

  const index = posts.findIndex((entry) => postSlug(entry) === slug);
  const prev = index > 0 ? posts[index - 1] : null;
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;

  const tags = postTags({ tags: post.tags });
  const tagSet = new Set(tags);
  const related = posts
    .filter((entry) => postSlug(entry) !== slug)
    .map((entry) => ({
      post: entry,
      score: postTags(entry).filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => toRef(entry.post, locale));

  const headings = extractHeadings(post.body);
  const readingMinutes = estimateReadingMinutes(post.body);

  const base = siteUrl();
  const canonical = `${base}${localePath(locale, `/posts/${slug}`)}`;
  const published = parseDate(post.date)?.toISOString();
  const image = post.cover ? new URL(post.cover, base).toString() : `${base}/opengraph-image`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description ?? undefined,
    image,
    inLanguage: htmlLang[locale],
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: {
      '@type': 'Person',
      name: home.profile.name,
      url: `${base}${localePath(locale, '/about')}`,
    },
    publisher: {
      '@type': 'Person',
      name: home.profile.name,
    },
    keywords: tags.join(', ') || undefined,
  };
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <PostClient
        locale={locale}
        query={result.query}
        variables={result.variables}
        data={result.data}
        headings={headings}
        readingMinutes={readingMinutes}
        tags={tags}
        series={post.series?.trim() || null}
        prev={prev ? toRef(prev, locale) : null}
        next={next ? toRef(next, locale) : null}
        related={related}
        labels={{
          minutes: messages.post.minutes,
          draft: messages.post.draft,
          series: messages.post.series,
          tags: messages.post.tags,
          previous: messages.post.previous,
          next: messages.post.next,
          prevNextAria: messages.post.prevNextAria,
          related: messages.post.related,
          back: messages.post.back,
          tocTitle: messages.toc.title,
          tocSections: messages.toc.sections,
          tocAria: messages.toc.aria,
          tagHrefPrefix: `${localePath(locale, '/tags')}/`,
          seriesHrefPrefix: `${localePath(locale, '/series')}/`,
          postsHref: localePath(locale, '/posts'),
        }}
      />
    </>
  );
}
