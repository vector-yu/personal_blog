import Body from '@/components/tina-markdown';
import { SectionLink } from '@/components/site/section-link';
import { localePath, type Locale } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { PageDoc } from '@/lib/pages';
import { formatDate } from '@/lib/site';

/**
 * A simple editorial page: eyebrow, title, optional last-updated date, then the
 * authored rich text. Used by Now and Uses; Start here has its own post list.
 */
export function ProsePage({
  page,
  eyebrow,
  locale,
  messages,
}: {
  page: PageDoc;
  eyebrow: string;
  locale: Locale;
  messages: Messages;
}) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-headline">{page.title}</h1>
          {page.date ? (
            <time
              dateTime={page.date}
              className="text-xs font-bold text-ink/40 tabular-nums dark:text-slate-500"
            >
              {formatMessage(messages.common.updated, {
                date: formatDate(page.date, locale),
              })}
            </time>
          ) : null}
        </div>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/posts')}>{messages.nav.posts}</SectionLink>
          <SectionLink href={localePath(locale, '/projects')}>
            {messages.nav.projects}
          </SectionLink>
          <SectionLink href={localePath(locale, '/about')}>{messages.nav.about}</SectionLink>
        </nav>
      </header>

      <div className="prose prose-slate mt-10 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-li:marker:text-iris">
        <Body content={page.body} locale={locale} />
      </div>
    </main>
  );
}
