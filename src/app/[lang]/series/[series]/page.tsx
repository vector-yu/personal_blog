import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/posts/post-card';
import { SectionLink } from '@/components/site/section-link';
import { localePath } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPosts } from '@/lib/posts';
import {
  collectSeries,
  collectTags,
  decodeSeriesParam,
  seriesPath,
  toPostListItem,
} from '@/lib/taxonomy';

type Params = { series: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const locale = await getLocale();
  const posts = await getPosts(locale);
  return collectSeries(posts, locale).map((item) => ({ series: item.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const series = decodeSeriesParam((await params).series);
  return buildMetadata({
    locale,
    path: seriesPath(series),
    title: formatMessage(messages.seriesDetail.metaTitle, { series }),
    description: formatMessage(messages.seriesDetail.metaDescription, { series }),
    translated: false,
  });
}

export default async function SeriesPage({ params }: { params: Promise<Params> }) {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const posts = await getPosts(locale);
  const series = decodeSeriesParam((await params).series);
  const items = posts.filter((post) => post.series?.trim() === series);

  if (items.length === 0) notFound();

  const tags = collectTags(posts, locale).map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.seriesDetail.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{series}</h1>
        <p className="mt-4 text-sm font-bold text-ink/50 dark:text-slate-400">
          {formatMessage(messages.seriesDetail.count, { count: items.length })}
        </p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/series')}>
            {messages.seriesDetail.allSeries}
          </SectionLink>
          <SectionLink href={localePath(locale, '/posts')}>
            {messages.seriesDetail.allPosts}
          </SectionLink>
          <SectionLink href={localePath(locale, '/tags')}>
            {messages.seriesDetail.tags}
          </SectionLink>
        </nav>
      </header>

      <ul className="mt-10 space-y-5">
        {items.map((post) => (
          <li key={post.relativePath}>
            <PostCard post={toPostListItem(post, locale)} tags={tags} />
          </li>
        ))}
      </ul>
    </main>
  );
}
