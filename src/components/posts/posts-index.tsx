import { EmptyBox } from '@/components/site/illustrations';
import { SectionLink } from '@/components/site/section-link';
import { PostList } from '@/components/posts/post-list';
import { Pagination } from '@/components/posts/pagination';
import { localePath, type Locale } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { PostSummary } from '@/lib/site';
import { collectTags, toPostListItem } from '@/lib/taxonomy';
import { paginate } from '@/lib/pagination';

export function PostsIndex({
  posts,
  page,
  locale,
  messages,
}: {
  posts: PostSummary[];
  page: number;
  locale: Locale;
  messages: Messages;
}) {
  const items = paginate(posts, page).map((post) => toPostListItem(post, locale));
  const tags = collectTags(posts, locale).map((tag) => tag.name);
  const base = localePath(locale, '/posts');

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
