import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLink } from '@/components/site/section-link';
import { getPosts } from '@/lib/posts';
import { groupByYear, postTags, tagPath } from '@/lib/taxonomy';
import { formatDate, postSlug } from '@/lib/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '归档',
  description: '按年份浏览全部文章。',
};

export default async function ArchivePage() {
  const posts = await getPosts();
  const groups = groupByYear(posts);

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Archive
        </p>
        <h1 className="mt-3 text-headline">归档</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">
          {posts.length > 0
            ? `${posts.length} 篇文章，按年份排列。`
            : '还没有文章。等第一篇发布后，这里会自动出现。'}
        </p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">全部文章</SectionLink>
          <SectionLink href="/tags">标签</SectionLink>
        </nav>
      </header>

      {groups.length > 0 ? (
        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <section key={group.year} aria-labelledby={`year-${group.year}`}>
              <div className="flex items-baseline gap-4">
                <h2
                  id={`year-${group.year}`}
                  className="text-2xl font-black tracking-tight tabular-nums"
                >
                  {group.year}
                </h2>
                <span className="text-xs font-bold text-ink/45 dark:text-slate-500">
                  {group.posts.length} 篇
                </span>
              </div>

              <ol className="mt-4 divide-y-2 divide-dashed divide-ink/15 border-t-2 border-dashed border-ink/15 dark:divide-chalk/15 dark:border-chalk/15">
                {group.posts.map((post) => (
                  <li key={post.relativePath} className="py-4">
                    <div className="grid gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
                      <time
                        dateTime={post.date}
                        className="text-xs font-bold text-ink/45 tabular-nums dark:text-slate-500"
                      >
                        {formatDate(post.date)}
                      </time>
                      <div className="min-w-0">
                        <Link
                          href={`/posts/${postSlug(post)}`}
                          className="font-bold decoration-iris decoration-2 underline-offset-4 hover:underline"
                        >
                          {post.title}
                        </Link>
                        {post.description ? (
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/55 dark:text-slate-400">
                            {post.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        {postTags(post).map((tag) => (
                          <Link
                            key={tag}
                            href={tagPath(tag)}
                            className="rounded-full border border-ink/15 bg-white/50 px-2 py-0.5 text-[0.65rem] font-bold text-ink/55 transition-colors hover:border-iris/50 hover:text-iris-text dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-indigo-200"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有文章。进入 /admin 创建第一篇吧。
        </p>
      )}
    </main>
  );
}
