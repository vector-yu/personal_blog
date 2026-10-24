import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Body from '@/components/tina-markdown';
import { PostCard } from '@/components/posts/post-card';
import { SectionLink } from '@/components/site/section-link';
import { localePath } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPage } from '@/lib/pages';
import { getPosts } from '@/lib/posts';
import { collectTags, toPostListItem } from '@/lib/taxonomy';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/start-here',
    title: messages.startHere.metaTitle,
    description: messages.startHere.metaDescription,
  });
}

export default async function StartHerePage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const [page, posts] = await Promise.all([
    getPage(locale, 'start-here.mdx'),
    getPosts(locale),
  ]);
  if (!page) notFound();

  const featured = posts.filter((post) => post.featured);
  const picks = (featured.length > 0 ? featured : posts).slice(0, 4);
  const tags = collectTags(posts, locale).map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.startHere.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{page.title}</h1>
      </header>

      <div className="prose prose-slate mt-8 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-li:marker:text-iris">
        <Body content={page.body} locale={locale} />
      </div>

      {picks.length > 0 ? (
        <section aria-labelledby="start-picks" className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="start-picks" className="text-title">
              {featured.length > 0 ? messages.startHere.featured : messages.startHere.recent}
            </h2>
            <span className="text-xs font-bold text-ink/40 dark:text-slate-500">
              {formatMessage(messages.startHere.count, { count: picks.length })}
            </span>
          </div>
          <ul className="mt-6 space-y-5">
            {picks.map((post) => (
              <li key={post.relativePath}>
                <PostCard post={toPostListItem(post, locale)} tags={tags} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label={messages.common.contentNav} className="mt-10 flex flex-wrap gap-2 border-t-2 border-dashed border-ink/15 pt-6 dark:border-chalk/15">
        <SectionLink href={localePath(locale, '/posts')}>{messages.startHere.navAll}</SectionLink>
        <SectionLink href={localePath(locale, '/projects')}>
          {messages.startHere.navProjects}
        </SectionLink>
        <SectionLink href={localePath(locale, '/notes')}>{messages.startHere.navNotes}</SectionLink>
        <SectionLink href={localePath(locale, '/tags')}>{messages.startHere.navTags}</SectionLink>
      </nav>
    </main>
  );
}
