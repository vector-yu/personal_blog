import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostsIndex } from '@/components/posts/posts-index';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPosts } from '@/lib/posts';
import { pageCount, pagePath } from '@/lib/pagination';

type Params = { page: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const locale = await getLocale();
  const posts = await getPosts(locale);
  return Array.from({ length: pageCount(posts.length) }, (_, index) => index + 1)
    .filter((page) => page > 1)
    .map((page) => ({ page: String(page) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const page = Number((await params).page);
  return buildMetadata({
    locale,
    path: pagePath(page, locale),
    title: `${messages.posts.metaTitle} · ${formatMessage(messages.common.page, { page })}`,
    description: messages.posts.metaDescription,
  });
}

export default async function PostsPagedPage({ params }: { params: Promise<Params> }) {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const page = Number((await params).page);
  const posts = await getPosts(locale);
  const totalPages = pageCount(posts.length);

  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();

  return <PostsIndex posts={posts} page={page} locale={locale} messages={messages} />;
}
