import { cache } from 'react';
import { client } from '@/lib/tina';
import { toPostSummaries } from '@/lib/site';

/**
 * All published posts, newest first, deduped per render.
 *
 * `revalidate = 60` on the route pages is what refreshes this; `cache()` only
 * prevents the same request from being issued twice while one page renders
 * (e.g. the post page asks for neighbours and the layout asks for nothing else).
 */
export const getPosts = cache(async () => {
  const { data } = await client.queries.postConnection();
  return toPostSummaries(data?.postConnection?.edges);
});
