import type { Metadata } from 'next';
import { PostsIndex } from '@/components/posts/posts-index';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getPosts } from '@/lib/posts';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/posts',
    title: messages.posts.metaTitle,
    description: messages.posts.metaDescription,
  });
}

export default async function PostsPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const posts = await getPosts(locale);
  return <PostsIndex posts={posts} page={1} locale={locale} messages={messages} />;
}
