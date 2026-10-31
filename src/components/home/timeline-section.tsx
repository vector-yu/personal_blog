import Link from 'next/link';
import { ResumeEntryRow } from '@/components/home/resume-entry';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The homepage résumé section.
 *
 * This used to be wrapped in the scroll-driven zipper sheet. That effect has
 * been removed: the rows are now a plain, readable list, with no overlay and no
 * client-side animation. The same rows are also used by the About page.
 */
export function TimelineSection({
  entries,
  readArticlesHref,
  readArticlesLabel,
  emptyText,
  presentLabel,
}: {
  entries: HomeTimelineEntry[];
  readArticlesHref: string;
  readArticlesLabel: string;
  emptyText: string;
  presentLabel: string;
}) {
  return (
    <section id="journey" className="relative w-full pt-16 pb-24 sm:pt-20">
      <ol className="mx-auto w-full max-w-7xl divide-y-2 divide-dashed divide-ink/15 px-6 dark:divide-chalk/15">
        {entries.length === 0 ? (
          <li className="py-14 text-center text-sm font-medium text-ink/60 dark:text-slate-400">
            {emptyText}
          </li>
        ) : (
          entries.map((entry, index) => (
            <ResumeEntryRow
              key={`${entry.period}-${entry.title}`}
              entry={entry}
              index={index}
              presentLabel={presentLabel}
            />
          ))
        )}
      </ol>

      <div className="scroll-reveal mx-auto mt-16 flex w-full max-w-7xl justify-center px-6">
        <Link
          href={readArticlesHref}
          className="rounded-full border-[3px] border-ink/85 bg-white/70 px-5 py-2.5 font-bold text-ink/80 shadow-brutal backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun hover:text-ink hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-chalk dark:hover:bg-white/15 dark:hover:text-white"
        >
          {readArticlesLabel}
        </Link>
      </div>
    </section>
  );
}
