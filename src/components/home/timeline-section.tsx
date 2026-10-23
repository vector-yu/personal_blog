import Link from 'next/link';
import { ZipTimeline } from '@/components/home/zip-timeline';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The résumé, with no section heading and no container: the zipper sheet is
 * full-bleed, and the rows underneath are open. The "履历" title lives on the
 * separate /resume page, not here.
 */
export function TimelineSection({ entries }: { entries: HomeTimelineEntry[] }) {
  return (
    <section id="journey" className="relative w-full pt-16 pb-24 sm:pt-20">
      <ZipTimeline entries={entries} />

      <div className="scroll-reveal mx-auto mt-16 flex w-full max-w-7xl justify-center px-6">
        <Link
          href="/posts"
          className="rounded-full border-[3px] border-ink/85 bg-white/70 px-5 py-2.5 font-bold text-ink/80 shadow-brutal backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun hover:text-ink hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-chalk dark:hover:bg-white/15 dark:hover:text-white"
        >
          去读文章 →
        </Link>
      </div>
    </section>
  );
}
