import Link from 'next/link';
import { EmptyBox } from '@/components/site/illustrations';
import { SectionLink } from '@/components/site/section-link';
import { PostList } from '@/components/posts/post-list';
import { Pagination } from '@/components/posts/pagination';
import { localePath, type Locale } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { DailyProblemSummary } from '@/lib/posts';
import type { PostSummary } from '@/lib/site';
import { collectTags, toPostListItem } from '@/lib/taxonomy';
import { paginate } from '@/lib/pagination';

export function PostsIndex({
  posts,
  page,
  locale,
  messages,
  daily,
}: {
  posts: PostSummary[];
  page: number;
  locale: Locale;
  messages: Messages;
  daily?: DailyProblemSummary;
}) {
  const items = paginate(posts, page).map((post) => toPostListItem(post, locale));
  const tags = collectTags(posts, locale).map((tag) => tag.name);
  const base = localePath(locale, '/posts');
  const latestWeek =
    daily?.latestWeek != null && daily.latestWeekYear != null
      ? formatMessage(messages.posts.dailySummary, {
          count: daily.count,
          weeks: daily.weeks,
          week: daily.latestWeek,
          year: daily.latestWeekYear,
        })
      : null;

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.posts.eyebrow}
          {page > 1 ? formatMessage(messages.posts.pageSuffix, { page }) : ''}
        </p>
        <h1 className="relative mt-3 inline-block text-headline">
          {messages.posts.title}
          <span
            aria-hidden
            className="absolute -bottom-2 left-0 block h-2 w-full origin-left animate-rule rounded-full bg-gradient-to-r from-iris via-blush to-sun"
          />
        </h1>
        {/* Decorative geometry echoing the home hero, without adding copy. */}
        <div aria-hidden className="mt-7 flex items-center gap-2">
          <span className="h-2.5 w-16 rounded-full bg-iris/70" />
          <span className="h-2.5 w-9 rounded-full bg-blush/70" />
          <span className="h-2.5 w-24 rounded-full bg-sun/80" />
          <span className="h-3.5 w-3.5 rotate-12 rounded-[4px] bg-mint/70" />
        </div>

        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={base} active={page === 1}>
            {messages.posts.navAll}
          </SectionLink>
          <SectionLink href={localePath(locale, '/tags')}>{messages.posts.navTags}</SectionLink>
          <SectionLink href={localePath(locale, '/archive')}>{messages.posts.navArchive}</SectionLink>
          <SectionLink href={localePath(locale, '/notes')}>{messages.posts.navNotes}</SectionLink>
          <SectionLink href={localePath(locale, '/series')}>{messages.posts.navSeries}</SectionLink>
          <SectionLink href={localePath(locale, '/start-here')}>
            {messages.posts.navStart}
          </SectionLink>
          <SectionLink href={localePath(locale, '/rss.xml')}>RSS</SectionLink>
        </nav>
      </header>

      {daily && daily.count > 0 ? (
        <Link
          href={daily.href}
          className="group mt-10 flex flex-col gap-4 rounded-2xl border-[3px] border-ink/85 bg-white/60 p-5 shadow-brutal backdrop-blur-xl backdrop-saturate-125 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-iris motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between dark:border-chalk/20 dark:bg-white/[0.04] dark:shadow-chalk dark:hover:shadow-chalk-lg"
        >
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gradient-to-br from-sun via-blush to-iris font-mono text-xs font-black text-ink shadow-brutal-xs dark:border-chalk"
            >
              {daily.count}
            </span>
            <div className="min-w-0">
              <p className="text-[0.62rem] font-black tracking-[0.2em] text-ink/45 uppercase dark:text-slate-400">
                {messages.posts.dailyEyebrow}
              </p>
              <p className="mt-1 text-title">{messages.posts.dailyTitle}</p>
              <p className="mt-1 text-sm leading-relaxed font-bold text-ink/60 dark:text-slate-300">
                {latestWeek}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border-2 border-ink/20 bg-white/60 px-3 py-1.5 text-xs font-bold text-ink/70 transition-colors group-hover:border-ink/60 group-hover:text-ink sm:self-auto dark:border-chalk/20 dark:bg-white/[0.05] dark:text-slate-300 dark:group-hover:border-chalk/50 dark:group-hover:text-white">
            {messages.posts.dailyCta}
            <span aria-hidden>→</span>
          </span>
        </Link>
      ) : null}

      {posts.length === 0 ? (
        <div className="mt-10 flex animate-rise flex-col items-center gap-6 py-8 text-center">
          <EmptyBox className="h-40 w-auto sm:h-48" />
          <p className="max-w-md leading-relaxed font-medium text-ink/70 dark:text-slate-300">
            {messages.posts.empty}
          </p>
        </div>
      ) : (
        <>
          <PostList
            posts={items}
            tags={tags}
            labels={{
              all: messages.posts.all,
              searchLabel: messages.posts.searchLabel,
              searchPlaceholder: messages.posts.searchPlaceholder,
              noResults: messages.posts.noResults,
              noTagPosts: messages.posts.noTagPosts,
              viewAllTagged: messages.posts.viewAllTagged,
            }}
            tagHrefPrefix={`${localePath(locale, '/tags')}/`}
          />
          <Pagination total={posts.length} page={page} locale={locale} labels={messages.pagination} />
        </>
      )}
    </main>
  );
}
