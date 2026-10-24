import Link from 'next/link';
import { TiltCard } from '@/components/site/tilt-card';
import { tagTone } from '@/components/posts/tag-tones';

/**
 * The one post card used by the article list, tag pages, series pages and the
 * "start here" page. Keeping it in one place means the tag links and colour
 * tones stay consistent everywhere.
 */
export type PostListItem = {
  slug: string;
  /** Locale-aware link to the post, computed on the server. */
  href: string;
  title: string;
  /** Machine-readable ISO date, for the <time dateTime> attribute. */
  dateIso: string;
  /** Already formatted on the server, so the card needs no date helpers. */
  dateLabel: string;
  description: string | null;
  tags: string[];
  /** Locale-aware tag links, computed on the server. */
  tagLinks: { name: string; href: string }[];
};

export function PostCard({ post, tags }: { post: PostListItem; tags: string[] }) {
  return (
    <TiltCard className="group relative overflow-hidden rounded-blob border-[3px] border-ink/85 bg-white/60 p-6 shadow-brutal backdrop-blur-xl backdrop-saturate-125 transition-shadow duration-300 hover:shadow-brutal-iris motion-reduce:transition-none dark:border-chalk/20 dark:bg-white/[0.04] dark:shadow-chalk dark:hover:shadow-chalk-lg">
      {/* Gradient spine, revealed on hover. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-iris via-blush to-sun opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
      />
      {/* Soft colour wash in the corner keeps the slab from reading flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-10 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_50%_50%,#6d5cff,transparent_70%)] opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-45 motion-reduce:transition-none"
      />

      <div className="relative">
        <h2 className="text-title">
          <Link
            href={post.href}
            className="decoration-iris decoration-2 underline-offset-4 hover:underline"
          >
            {post.title}
          </Link>
        </h2>

        <time
          dateTime={post.dateIso}
          className="mt-2.5 inline-flex items-center rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs font-bold text-ink/75 dark:border-chalk/15 dark:bg-white/[0.06] dark:text-slate-300"
        >
          {post.dateLabel}
        </time>

        {post.description ? (
          <p className="mt-3 leading-relaxed text-ink/75 dark:text-slate-300">{post.description}</p>
        ) : null}

        {post.tagLinks.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tagLinks.map((tag) => (
              <Link
                key={tag.name}
                href={tag.href}
                className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-chalk-xs ${tagTone(tag.name, tags)}`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </TiltCard>
  );
}
