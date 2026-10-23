import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/posts/post-card';
import { SectionLink } from '@/components/site/section-link';
import { getPosts } from '@/lib/posts';
import {
  collectSeries,
  collectTags,
  decodeSeriesParam,
  seriesPath,
  toPostListItem,
} from '@/lib/taxonomy';

type Params = { series: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getPosts();
  return collectSeries(posts).map((item) => ({ series: item.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const series = decodeSeriesParam((await params).series);
  return {
    title: `系列：${series}`,
    description: `「${series}」系列的全部文章。`,
    alternates: { canonical: seriesPath(series) },
  };
}

export default async function SeriesPage({ params }: { params: Promise<Params> }) {
  const posts = await getPosts();
  const series = decodeSeriesParam((await params).series);
  const items = posts.filter((post) => post.series?.trim() === series);

  if (items.length === 0) notFound();

  const tags = collectTags(posts).map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Series
        </p>
        <h1 className="mt-3 text-headline">{series}</h1>
        <p className="mt-4 text-sm font-bold text-ink/50 dark:text-slate-400">
          {items.length} 篇文章
        </p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/series">全部系列</SectionLink>
          <SectionLink href="/posts">全部文章</SectionLink>
          <SectionLink href="/tags">标签</SectionLink>
        </nav>
      </header>

      <ul className="mt-10 space-y-5">
        {items.map((post) => (
          <li key={post.relativePath}>
            <PostCard post={toPostListItem(post)} tags={tags} />
          </li>
        ))}
      </ul>
    </main>
  );
}
