import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PostClient from './post-client';
import type { PostRef } from '@/components/posts/post-ref';
import { client } from '@/lib/tina';
import { getPosts } from '@/lib/posts';
import { getHomeContent } from '@/lib/home';
import { formatDate, parseDate, postSlug, siteUrl, type PostSummary } from '@/lib/site';
import { postTags } from '@/lib/taxonomy';
import { estimateReadingMinutes, extractHeadings } from '@/lib/toc';

/**
 * Catch-all (`[...filename]`) rather than a single segment (`[filename]`), so posts in
 * subfolders work: `content/posts/2026/new-post.mdx` is served at `/posts/2026/new-post`.
 * With a single segment Next encodes the slash as `%2F` when prerendering
 * (`/posts/2026%2Fnested-post`), which never matches the URL the lists and sitemap emit.
 */
type Params = { filename: string[] };

/**
 * Revalidate so an edit to a published post actually reaches the article page.
 * Without this the page keeps its build-time HTML until the next deploy, while the list
 * and home page (both revalidate=60) already show the new title — the classic
 * "the list updated but the article didn't" confusion.
 */
export const revalidate = 60;

/** Route segments -> the path used to look the document up in the collection. */
function toRelativePath(segments: string[]) {
  const slug = segments.join('/');
  return slug.endsWith('.mdx') || slug.endsWith('.md') ? slug : `${slug}.mdx`;
}

function isPublished(node: { draft: boolean | null } | null | undefined) {
  return Boolean(node) && !node?.draft;
}

function toRef(post: PostSummary): PostRef {
  return {
    slug: postSlug(post),
    title: post.title,
    dateLabel: formatDate(post.date),
    tags: postTags(post),
  };
}

/**
 * Pre-render every published post as static HTML at build time.
 *
 * Uses `_sys.relativePath` (not `filename`, which is only the basename) so subfolders
 * resolve, and excludes drafts so `draft: true` really does unpublish a post rather than
 * only hiding it from lists.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getPosts();
  return posts.map((post) => ({
    filename: post.relativePath.replace(/\.mdx?$/, '').split('/'),
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { filename } = await params;
  const relativePath = toRelativePath(filename);

  try {
    // The client uses errorPolicy: 'include' (see src/lib/tina.ts), so a missing document
    // resolves to a null post instead of rejecting.
    const { data } = await client.queries.post({ relativePath });
    if (!isPublished(data?.post)) return { title: '文章未找到' };

    // A page-level `openGraph` replaces the layout's object rather than merging, so the
    // site name has to be repeated here. Read it from the homepage document so renaming
    // the site in the editor updates article shares too.
    const { siteName } = await getHomeContent();

    const post = data.post;
    const description = post.description ?? undefined;
    const image = post.cover ?? '/opengraph-image';

    return {
      title: post.title,
      description,
      // Without openGraph the shared link has no title/description/image at all, and without
      // the image a share renders as a bare URL. The canonical URL is resolved against the
      // site origin because a relative og:url is not usable by most crawlers.
      alternates: { canonical: `/posts/${filename.join('/')}` },
      openGraph: {
        type: 'article',
        // Repeated from the root layout on purpose: a page-level `openGraph` object replaces the
        // layout's rather than deep-merging, so omitting siteName here drops og:site_name.
        siteName,
        title: post.title,
        description,
        url: `/posts/${filename.join('/')}`,
        publishedTime: parseDate(post.date)?.toISOString(),
        images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        images: [image],
      },
    };
  } catch {
    // A transport-level failure (offline, DNS) must not be reported as "not found".
    return { title: '文章暂时无法加载' };
  }
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { filename } = await params;
  const relativePath = toRelativePath(filename);

  let result: Awaited<ReturnType<typeof client.queries.post>>;
  try {
    result = await client.queries.post({ relativePath });
  } catch (error) {
    // Only transport failures land here. They must surface as errors rather than being
    // baked in as a permanent 404 for a post that exists.
    console.error(`Failed to load post "${relativePath}":`, error);
    throw error;
  }

  // A missing record resolves with a null post (errorPolicy: 'include'); a draft must not be
  // publicly reachable.
  const post = result.data?.post;
  if (!post || post.draft) notFound();

  const slug = postSlug({ relativePath: post._sys.relativePath });

  const [posts, home] = await Promise.all([getPosts(), getHomeContent()]);

  const index = posts.findIndex((entry) => postSlug(entry) === slug);
  const prev = index > 0 ? posts[index - 1] : null;
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;

  const tags = postTags({ tags: post.tags });
  const tagSet = new Set(tags);
  const related = posts
    .filter((entry) => postSlug(entry) !== slug)
    .map((entry) => ({
      post: entry,
      score: postTags(entry).filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => toRef(entry.post));

  const headings = extractHeadings(post.body);
  const readingMinutes = estimateReadingMinutes(post.body);

  const base = siteUrl();
  const canonical = `${base}/posts/${post._sys.relativePath.replace(/\.mdx?$/, '')}`;
  const published = parseDate(post.date)?.toISOString();
  const image = post.cover ? new URL(post.cover, base).toString() : `${base}/opengraph-image`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description ?? undefined,
    image,
    inLanguage: 'zh-CN',
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: {
      '@type': 'Person',
      name: home.profile.name,
      url: `${base}/about`,
    },
    publisher: {
      '@type': 'Person',
      name: home.profile.name,
    },
    keywords: tags.join(', ') || undefined,
  };
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  // Pass the generated query + variables alongside the data so the client page can
  // re-fetch and live-update inside the TinaCMS visual editor.
  return (
    <>
      <script
        type="application/ld+json"
        // Escape `<` so a title/description containing `</script>` cannot end the tag.
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <PostClient
        query={result.query}
        variables={result.variables}
        data={result.data}
        headings={headings}
        readingMinutes={readingMinutes}
        tags={tags}
        prev={prev ? toRef(prev) : null}
        next={next ? toRef(next) : null}
        related={related}
      />
    </>
  );
}
