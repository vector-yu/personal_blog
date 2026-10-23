import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProsePage } from '@/components/site/prose-page';
import { getPage } from '@/lib/pages';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Now',
  description: '最近在做什么、在学什么、在想什么。',
};

export default async function NowPage() {
  const page = await getPage('now.mdx');
  if (!page) notFound();

  return <ProsePage page={page} eyebrow="Now" />;
}
