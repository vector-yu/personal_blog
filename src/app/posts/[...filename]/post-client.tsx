'use client';

import Link from 'next/link';
import { m, useScroll, useSpring } from 'framer-motion';
import { useTina } from 'tinacms/dist/react';
import Body from '@/components/tina-markdown';
import { TableOfContents } from '@/components/posts/table-of-contents';
import { tagTone } from '@/components/posts/tag-tones';
import type { PostRef } from '@/components/posts/post-ref';
import { useNoMotion } from '@/components/site/use-no-motion';
import { formatDate } from '@/lib/site';
import type { TocHeading } from '@/lib/toc';
import type { PostQuery, PostQueryVariables } from '@/tina/__generated__/types';

/**
 * Client page: `useTina` swaps the sidebar data in while editing, so changes made in the
 * TinaCMS visual editor appear here immediately. In production it just renders `data`.
 *
 * Layout: the article keeps a readable 3xl measure; from `lg` up a sticky TOC rail sits
 * to its right (Notion-style). The rail is server-fed from the same AST the body renders,
 * so its anchors always match the h2/h3 ids.
 */
export default function PostClient(props: {
  query: string;
  variables: PostQueryVariables;
  data: PostQuery;
  headings: TocHeading[];
  readingMinutes: number;
  tags: string[];
  prev: PostRef | null;
  next: PostRef | null;
  related: PostRef[];
}) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const post = data.post;
  const { headings, readingMinutes, tags, prev, next, related } = props;
  const hasToc = headings.length > 1;

  // `useReducedMotion` is not cosmetic here: the spring is exactly the kind of
  // large-area easing that vestibular-sensitive visitors disable. Without it we
  // fall back to the raw scroll value, which still informs without animating.
  const noMotion = useNoMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 34,
    restDelta: 0.001,
  });
  const progress = noMotion ? scrollYProgress : smoothed;

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      {/* --- Reading progress: a gradient rule pinned to the very top --------- */}
      <m.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-1.5 origin-left bg-gradient-to-r from-iris via-blush to-sun print:hidden"
      />

      <div
        className={
          hasToc
            ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12 xl:gap-16'
            : 'mx-auto max-w-3xl'
        }
      >
        <article className="mx-auto w-full max-w-3xl">
          {/* --- Title block (unframed) -------------------------------------- */}
          <header className="animate-rise">
            <span
              aria-hidden
              className="block h-2 w-24 origin-left animate-rule rounded-full bg-gradient-to-r from-iris via-blush to-sun"
            />

            <h1 className="mt-6 text-headline text-balance sm:text-display">{post.title}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
              <time
                dateTime={post.date}
                className="inline-flex items-center rounded-full border-2 border-ink/20 bg-white/70 px-3 py-1 text-xs font-bold text-ink/75 backdrop-blur dark:border-chalk/20 dark:bg-white/[0.06] dark:text-slate-300"
              >
                {formatDate(post.date)}
              </time>

              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 bg-white/70 px-3 py-1 text-xs font-bold text-ink/65 backdrop-blur dark:border-chalk/20 dark:bg-white/[0.06] dark:text-slate-300">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mint" />
                约 {readingMinutes} 分钟
              </span>

              {post.draft ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-700/60 bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 backdrop-blur dark:border-amber-300/40 dark:bg-amber-500/15 dark:text-amber-200">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" />
                  草稿
                </span>
              ) : null}
            </div>

            {post.description ? (
              <p className="mt-5 text-lg leading-relaxed text-ink/75 dark:text-slate-300">
                {post.description}
              </p>
            ) : null}

            <hr
              aria-hidden
              className="mt-9 h-0.5 border-0 bg-gradient-to-r from-ink/15 via-ink/8 to-transparent dark:from-chalk/20 dark:via-chalk/10"
            />
          </header>

          {hasToc ? <TableOfContents headings={headings} placement="mobile" /> : null}

          {/* --- Body: prose straight on the page (unframed) ------------------- */}
          <div className="prose prose-slate mt-9 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h1:border-b-0 prose-strong:font-black prose-li:marker:text-iris prose-hr:my-10 [animation-delay:120ms]">
            <Body content={post.body} />
          </div>

          {tags.length > 0 ? (
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="text-[0.65rem] font-black tracking-[0.16em] text-ink/40 uppercase dark:text-slate-500">
                标签
              </span>
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-chalk-xs ${tagTone(tag, tags)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          {prev || next ? (
            <nav aria-label="上一篇 / 下一篇" className="mt-10 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/posts/${prev.slug}`}
                  className="group rounded-2xl border-2 border-ink/15 bg-white/50 p-4 backdrop-blur transition-colors duration-200 hover:border-ink/40 dark:border-chalk/15 dark:bg-white/[0.03] dark:hover:border-chalk/35"
                >
                  <span className="text-[0.65rem] font-black tracking-[0.14em] text-ink/40 uppercase dark:text-slate-500">
                    ← 上一篇
                  </span>
                  <span className="mt-1.5 block font-bold group-hover:text-iris-text dark:group-hover:text-indigo-200">
                    {prev.title}
                  </span>
                </Link>
              ) : null}
              {next ? (
                <Link
                  href={`/posts/${next.slug}`}
                  className="group rounded-2xl border-2 border-ink/15 bg-white/50 p-4 text-left backdrop-blur transition-colors duration-200 hover:border-ink/40 sm:text-right dark:border-chalk/15 dark:bg-white/[0.03] dark:hover:border-chalk/35"
                >
                  <span className="text-[0.65rem] font-black tracking-[0.14em] text-ink/40 uppercase dark:text-slate-500">
                    下一篇 →
                  </span>
                  <span className="mt-1.5 block font-bold group-hover:text-iris-text dark:group-hover:text-indigo-200">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}

          {related.length > 0 ? (
            <section
              aria-labelledby="related-heading"
              className="mt-12 border-t-2 border-dashed border-ink/15 pt-8 dark:border-chalk/15"
            >
              <h2
                id="related-heading"
                className="text-sm font-black tracking-[0.14em] text-ink/50 uppercase dark:text-slate-400"
              >
                继续阅读
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/posts/${item.slug}`}
                      className="group block rounded-xl border-2 border-ink/10 bg-white/40 p-4 backdrop-blur transition-colors duration-200 hover:border-ink/35 dark:border-chalk/10 dark:bg-white/[0.03] dark:hover:border-chalk/30"
                    >
                      <span className="block leading-snug font-bold group-hover:text-iris-text dark:group-hover:text-indigo-200">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-ink/40 dark:text-slate-500">
                        {item.dateLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mt-12 text-sm">
            <Link
              href="/posts"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-ink/85 bg-white/70 px-4 py-2 font-bold text-ink/75 shadow-brutal-xs backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun hover:text-ink hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-chalk-xs dark:hover:bg-white/15 dark:hover:text-white"
            >
              <m.span aria-hidden whileHover={{ x: noMotion ? 0 : -4 }} className="inline-block">
                ←
              </m.span>
              返回文章列表
            </Link>
          </p>
        </article>

        {hasToc ? (
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
              <TableOfContents headings={headings} placement="desktop" />
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
