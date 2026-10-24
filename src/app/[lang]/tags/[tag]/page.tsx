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
  collectTags,
  decodeTagParam,
  postTags,
  tagPath,
  toPostListItem,
} from '@/lib/taxonomy';

type Params = { tag: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const locale = await getLocale();
  const posts = await getPosts(locale);
  return collectTags(posts, locale).map((tag) => ({ tag: tag.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const tag = decodeTagParam((await params).tag);
  return buildMetadata({
    locale,
    path: tagPath(tag),
    title: formatMessage(messages.tag.metaTitle, { tag }),
    description: formatMessage(messages.tag.metaDescription, { tag }),
    translated: false,
  });
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const posts = await getPosts(locale);
  const tag = decodeTagParam((await params).tag);
  const tagged = posts.filter((post) => postTags(post).includes(tag));

  if (tagged.length === 0) notFound();

  const allTags = collectTags(posts, locale).map((entry) => entry.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.tag.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">
          <span aria-hidden className="mr-1 text-iris">
            #
          </span>
          {tag}
        </h1>
        <p className="mt-4 leading-relaxed text-ink/65 dark:text-slate-300">
          {formatMessage(messages.tag.taggedCount, { count: tagged.length })}
        </p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/tags')}>{messages.tag.allTags}</SectionLink>
          <SectionLink href={localePath(locale, '/posts')}>
            {messages.tag.navAllPosts}
          </SectionLink>
          <SectionLink href={localePath(locale, '/archive')}>{messages.tag.navArchive}</SectionLink>
        </nav>
      </header>

      <ul className="mt-10 space-y-5">
        {tagged.map((post) => (
          <li key={post.relativePath}>
            <PostCard post={toPostListItem(post, locale)} tags={allTags} />
          </li>
        ))}
      </ul>
    </main>
  );
}
