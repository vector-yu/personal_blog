import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostsIndex } from '@/components/posts/posts-index';
import { getPosts } from '@/lib/posts';
import { pageCount, pagePath } from '@/lib/pagination';

type Params = { page: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getPosts();
  return Array.from({ length: pageCount(posts.length) }, (_, index) => index + 1)
    .filter((page) => page > 1)
    .map((page) => ({ page: String(page) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const page = Number((await params).page);
  return {
    title: `文章 · 第 ${page} 页`,
    description: '按发布时间排列的全部文章。',
    alternates: { canonical: pagePath(page) },
  };
}

export default async function PostsPagedPage({ params }: { params: Promise<Params> }) {
  const page = Number((await params).page);
  const posts = await getPosts();
  const totalPages = pageCount(posts.length);

  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();

  return <PostsIndex posts={posts} page={page} />;
}
