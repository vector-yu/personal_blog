import Link from 'next/link';
import { BlueprintTimeline } from '@/components/home/blueprint-timeline';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The homepage résumé section.
 *
 * `BlueprintTimeline` owns the sticky technical sheet (and its static mobile /
 * reduced-motion fallback); this wrapper adds the normal-flow link that follows
 * the pinned scroll track.
 */
export function TimelineSection({
  entries,
  readArticlesHref,
  readArticlesLabel,
  emptyText,
  presentLabel,
  labels,
}: {
  entries: HomeTimelineEntry[];
  readArticlesHref: string;
  readArticlesLabel: string;
  emptyText: string;
  presentLabel: string;
  labels: {
    eyebrow: string;
    title: string;
    hint: string;
    end: string;
  };
}) {
  return (
    <>
      <BlueprintTimeline
        entries={entries}
        emptyText={emptyText}
        presentLabel={presentLabel}
        labels={labels}
      />

      <div className="scroll-reveal mx-auto flex w-full max-w-7xl justify-center px-6 pt-10 pb-24 sm:pt-14">
        <Link
          href={readArticlesHref}
          className="rounded-full border-[3px] border-ink/85 bg-white/70 px-5 py-2.5 font-bold text-ink/80 shadow-brutal backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun hover:text-ink hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-chalk dark:hover:bg-white/15 dark:hover:text-white"
        >
          {readArticlesLabel}
        </Link>
      </div>
    </>
  );
}
