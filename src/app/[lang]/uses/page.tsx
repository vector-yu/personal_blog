import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProsePage } from '@/components/site/prose-page';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPage } from '@/lib/pages';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/uses',
    title: messages.uses.metaTitle,
    description: messages.uses.metaDescription,
  });
}

export default async function UsesPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const page = await getPage(locale, 'uses.mdx');
  if (!page) notFound();

  return (
    <ProsePage page={page} eyebrow={messages.uses.eyebrow} locale={locale} messages={messages} />
  );
}
