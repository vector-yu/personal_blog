import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProsePage } from '@/components/site/prose-page';
import { getPage } from '@/lib/pages';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Uses',
  description: '日常使用的硬件、软件和工具。',
};

export default async function UsesPage() {
  const page = await getPage('uses.mdx');
  if (!page) notFound();

  return <ProsePage page={page} eyebrow="Uses" />;
}
