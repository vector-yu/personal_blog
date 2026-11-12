import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PostsIndex } from '@/components/posts/posts-index';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getDailyProblemSummary, getEditorialPosts } from '@/lib/posts';
import { pageCount, pagePath } from '@/lib/pagination';
import { isWeeklySeries } from '@/lib/weeks';

type Params = { pageNumber: string };

export const revalidate = 60;

/**
 * Count published **editorial** posts from the filesystem instead of the async Tina client.
 *
 * `generateStaticParams` must be synchronous on this nested route: Next 16
 * silently drops the params when it is async here (the public URL is rewritten
 * from `/posts/page/N` to this internal `/posts/p/N` route). Pagination only
 * needs the count, so a build-time file scan is both accurate and cheap.
 *
 * Daily-problem series posts are excluded, matching `getEditorialPosts`; otherwise
 * Next would prerender empty pages `/posts/page/2..N` that 404 at request time.
 */
function countPublished(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countPublished(full);
      continue;
    }
    if (!/\.mdx?$/.test(entry.name)) continue;
    const source = readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const series = /^series:\s*(.+)$/m
      .exec(frontmatter)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, '');
    if (series && isWeeklySeries(series)) continue;
    count += 1;
  }
  return count;
}

export function generateStaticParams(): Params[] {
  const max = Math.max(countPublished('content/posts'), countPublished('content/posts-en'));
  return Array.from({ length: pageCount(max) }, (_, index) => index + 1)
    .filter((page) => page > 1)
    .map((page) => ({ pageNumber: String(page) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const page = Number((await params).pageNumber);
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
  const page = Number((await params).pageNumber);
  const [posts, daily] = await Promise.all([
    getEditorialPosts(locale),
    getDailyProblemSummary(locale),
  ]);
  const totalPages = pageCount(posts.length);

  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();

  return (
    <PostsIndex
      posts={posts}
      page={page}
      locale={locale}
      messages={messages}
      daily={daily}
    />
  );
}
