import { PostsIndex } from '@/components/posts/posts-index';
import { getPosts } from '@/lib/posts';

export const revalidate = 60;

export default async function PostsPage() {
  const posts = await getPosts();
  return <PostsIndex posts={posts} page={1} />;
}
