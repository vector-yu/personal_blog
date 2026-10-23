import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLink } from '@/components/site/section-link';
import { getPosts } from '@/lib/posts';
import { collectSeries, seriesPath } from '@/lib/taxonomy';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '系列',
  description: '按主题串联的文章系列。',
};

export default async function SeriesIndexPage() {
  const posts = await getPosts();
  const series = collectSeries(posts);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Series
        </p>
        <h1 className="mt-3 text-headline">系列</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">
          {series.length > 0
            ? `${series.length} 个系列。适合按顺序读，或者从感兴趣的一篇跳进去。`
            : '还没有系列。给文章填写「所属系列」后，这里会自动生成聚合页。'}
        </p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">全部文章</SectionLink>
          <SectionLink href="/tags">标签</SectionLink>
          <SectionLink href="/archive">归档</SectionLink>
        </nav>
      </header>

      {series.length > 0 ? (
        <ul className="mt-10 space-y-4">
          {series.map((item) => (
            <li key={item.name}>
              <Link
                href={seriesPath(item.name)}
                className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/15 bg-white/55 p-5 shadow-brutal-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-brutal motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.03] dark:shadow-chalk-sm dark:hover:border-chalk/35"
              >
                <div>
                  <h2 className="text-title group-hover:text-iris-text dark:group-hover:text-indigo-200">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-ink/45 dark:text-slate-500">
                    {item.count} 篇文章
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
          还没有系列。在文章编辑页的「所属系列」里填写一个名字即可。
        </p>
      )}
    </main>
  );
}
