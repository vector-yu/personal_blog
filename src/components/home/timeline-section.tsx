import Link from 'next/link';
import { SectionHeading } from '@/components/home/section-heading';
import { ZipTimeline } from '@/components/home/zip-timeline';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * Server wrapper for the résumé. Keeping the heading on the server means the
 * client bundle only carries the zipper interaction, not the section copy.
 */
export function TimelineSection({ entries }: { entries: HomeTimelineEntry[] }) {
  return (
    <section
      id="journey"
      className="relative mx-auto w-full max-w-4xl scroll-mt-24 px-4 pt-24 pb-28 sm:pt-28"
    >
      <SectionHeading
        index="02"
        title="履历"
        description="一条从最近往回看的时间线。把拉链拉到底，就是下一页故事开始的地方。"
      />
      <ZipTimeline entries={entries} />

      {/* A quiet exit: the résumé is the end of the introduction, not the end of
          the site. The header already links here, but a bottom affordance makes
          the hand-off to the writing explicit. */}
      <div className="scroll-reveal mt-14 flex justify-center">
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
