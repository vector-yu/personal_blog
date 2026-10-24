import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLink } from '@/components/site/section-link';
import { localePath } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPosts } from '@/lib/posts';
import { collectSeries, seriesPath } from '@/lib/taxonomy';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/series',
    title: messages.series.metaTitle,
    description: messages.series.metaDescription,
  });
}

export default async function SeriesIndexPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const posts = await getPosts(locale);
  const series = collectSeries(posts, locale);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.series.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{messages.series.title}</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">
          {series.length > 0
            ? formatMessage(messages.series.summary, { count: series.length })
            : messages.series.emptySummary}
        </p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/posts')}>{messages.series.navAll}</SectionLink>
          <SectionLink href={localePath(locale, '/tags')}>{messages.series.navTags}</SectionLink>
          <SectionLink href={localePath(locale, '/archive')}>
            {messages.series.navArchive}
          </SectionLink>
        </nav>
      </header>

      {series.length > 0 ? (
        <ul className="mt-10 space-y-4">
          {series.map((item) => (
            <li key={item.name}>
              <Link
                href={localePath(locale, seriesPath(item.name))}
                className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/15 bg-white/55 p-5 shadow-brutal-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-brutal motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.03] dark:shadow-chalk-sm dark:hover:border-chalk/35"
              >
                <div>
                  <h2 className="text-title group-hover:text-iris-text dark:group-hover:text-indigo-200">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-ink/45 dark:text-slate-500">
                    {formatMessage(messages.series.count, { count: item.count })}
                  </p>
                </div>
                <span aria-hidden className="text-2xl text-ink/30 dark:text-slate-500">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          {messages.series.empty}
        </p>
      )}
    </main>
  );
}
