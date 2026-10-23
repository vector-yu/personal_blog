import { EmptyBox } from '@/components/site/illustrations';
import { SectionLink } from '@/components/site/section-link';
import { PostList } from '@/components/posts/post-list';
import { Pagination } from '@/components/posts/pagination';
import type { PostSummary } from '@/lib/site';
import { collectTags, toPostListItem } from '@/lib/taxonomy';
import { paginate } from '@/lib/pagination';

export function PostsIndex({ posts, page }: { posts: PostSummary[]; page: number }) {
  const items = paginate(posts, page).map(toPostListItem);
  const tags = collectTags(posts).map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Writing
          {page > 1 ? ` · Page ${page}` : ''}
        </p>
        <h1 className="relative mt-3 inline-block text-headline">
          文章
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

        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts" active={page === 1}>
            全部文章
          </SectionLink>
          <SectionLink href="/tags">标签</SectionLink>
          <SectionLink href="/archive">归档</SectionLink>
          <SectionLink href="/notes">笔记</SectionLink>
          <SectionLink href="/series">系列</SectionLink>
          <SectionLink href="/start-here">从这开始</SectionLink>
          <SectionLink href="/rss.xml">RSS</SectionLink>
        </nav>
      </header>

      {posts.length === 0 ? (
        <div className="mt-10 flex animate-rise flex-col items-center gap-6 py-8 text-center">
          <EmptyBox className="h-40 w-auto sm:h-48" />
          <p className="max-w-md leading-relaxed font-medium text-ink/70 dark:text-slate-300">
            还没有文章。进入 /admin/index.html 创建第一篇吧。
          </p>
        </div>
      ) : (
        <>
          <PostList posts={items} tags={tags} />
          <Pagination total={posts.length} page={page} />
        </>
      )}
    </main>
  );
}
