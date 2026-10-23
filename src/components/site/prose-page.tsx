import Body from '@/components/tina-markdown';
import { SectionLink } from '@/components/site/section-link';
import type { PageDoc } from '@/lib/pages';
import { formatDate } from '@/lib/site';

/**
 * A simple editorial page: eyebrow, title, optional last-updated date, then the
 * authored rich text. Used by Now and Uses; Start here has its own post list.
 */
export function ProsePage({ page, eyebrow }: { page: PageDoc; eyebrow: string }) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-headline">{page.title}</h1>
          {page.date ? (
            <time
              dateTime={page.date}
              className="text-xs font-bold text-ink/40 tabular-nums dark:text-slate-500"
            >
              最后更新于 {formatDate(page.date)}
            </time>
          ) : null}
        </div>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">文章</SectionLink>
          <SectionLink href="/projects">项目</SectionLink>
          <SectionLink href="/about">关于</SectionLink>
        </nav>
      </header>

      <div className="prose prose-slate mt-10 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-li:marker:text-iris">
        <Body content={page.body} />
      </div>
    </main>
  );
}
