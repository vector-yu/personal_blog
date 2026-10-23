import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/posts/post-card';
import { SectionLink } from '@/components/site/section-link';
import { getPosts } from '@/lib/posts';
import {
  collectTags,
  decodeTagParam,
  postTags,
  tagPath,
  toPostListItem,
} from '@/lib/taxonomy';

type Params = { tag: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getPosts();
  return collectTags(posts).map((tag) => ({ tag: tag.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const tag = decodeTagParam((await params).tag);
  return {
    title: `标签：${tag}`,
    description: `所有带有「${tag}」标签的文章。`,
    alternates: { canonical: tagPath(tag) },
  };
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const posts = await getPosts();
  const tag = decodeTagParam((await params).tag);
  const tagged = posts.filter((post) => postTags(post).includes(tag));

  if (tagged.length === 0) notFound();

  const allTags = collectTags(posts).map((entry) => entry.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Tag
        </p>
        <h1 className="mt-3 text-headline">
          <span aria-hidden className="mr-1 text-iris">
            #
          </span>
          {tag}
        </h1>
        <p className="mt-4 leading-relaxed text-ink/65 dark:text-slate-300">
          {tagged.length} 篇文章带着这个标签。
        </p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/tags">全部标签</SectionLink>
          <SectionLink href="/posts">全部文章</SectionLink>
          <SectionLink href="/archive">归档</SectionLink>
        </nav>
      </header>

      <ul className="mt-10 space-y-5">
        {tagged.map((post) => (
          <li key={post.relativePath}>
            <PostCard post={toPostListItem(post)} tags={allTags} />
          </li>
        ))}
      </ul>
    </main>
  );
}
