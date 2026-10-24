import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLink } from '@/components/site/section-link';
import { tagTone } from '@/components/posts/tag-tones';
import { localePath } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPosts } from '@/lib/posts';
import { collectTags, tagPath } from '@/lib/taxonomy';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/tags',
    title: messages.tags.metaTitle,
    description: messages.tags.metaDescription,
  });
}

export default async function TagsPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const posts = await getPosts(locale);
  const tags = collectTags(posts, locale);
  const names = tags.map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.tags.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{messages.tags.title}</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">
          {tags.length > 0
            ? formatMessage(messages.tags.summary, {
                tagCount: tags.length,
                postCount: posts.length,
              })
            : messages.tags.emptySummary}
        </p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/posts')}>{messages.tags.navAll}</SectionLink>
          <SectionLink href={localePath(locale, '/archive')}>{messages.tags.navArchive}</SectionLink>
        </nav>
      </header>

      {tags.length > 0 ? (
        <ul className="mt-10 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <li key={tag.name}>
              <Link
                href={localePath(locale, tagPath(tag.name))}
                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold shadow-brutal-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-chalk-xs ${tagTone(tag.name, names)}`}
              >
                {tag.name}
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[0.65rem] font-black tabular-nums dark:bg-white/10">
                  {tag.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          {messages.tags.empty}
        </p>
      )}
    </main>
  );
}
