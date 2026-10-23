import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Body from '@/components/tina-markdown';
import { PostCard } from '@/components/posts/post-card';
import { SectionLink } from '@/components/site/section-link';
import { getPage } from '@/lib/pages';
import { getPosts } from '@/lib/posts';
import { collectTags, toPostListItem } from '@/lib/taxonomy';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '从这开始',
  description: '第一次来？从这几篇文章开始了解这个站。',
};

export default async function StartHerePage() {
  const [page, posts] = await Promise.all([getPage('start-here.mdx'), getPosts()]);
  if (!page) notFound();

  const featured = posts.filter((post) => post.featured);
  const picks = (featured.length > 0 ? featured : posts).slice(0, 4);
  const tags = collectTags(posts).map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Start here
        </p>
        <h1 className="mt-3 text-headline">{page.title}</h1>
      </header>

      <div className="prose prose-slate mt-8 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-li:marker:text-iris">
        <Body content={page.body} />
      </div>

      {picks.length > 0 ? (
        <section aria-labelledby="start-picks" className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="start-picks" className="text-title">
              {featured.length > 0 ? '精选文章' : '最近文章'}
            </h2>
            <span className="text-xs font-bold text-ink/40 dark:text-slate-500">
              {picks.length} 篇
            </span>
          </div>
          <ul className="mt-6 space-y-5">
            {picks.map((post) => (
              <li key={post.relativePath}>
                <PostCard post={toPostListItem(post)} tags={tags} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="内容导航" className="mt-10 flex flex-wrap gap-2 border-t-2 border-dashed border-ink/15 pt-6 dark:border-chalk/15">
        <SectionLink href="/posts">全部文章</SectionLink>
        <SectionLink href="/projects">项目</SectionLink>
        <SectionLink href="/notes">笔记</SectionLink>
        <SectionLink href="/tags">标签</SectionLink>
      </nav>
    </main>
  );
}
