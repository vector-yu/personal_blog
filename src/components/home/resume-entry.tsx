import type { HomeTimelineEntry } from '@/lib/home';

/**
 * One résumé row for the About page section (`/about#resume`). The homepage
 * timeline uses the shared data through its own blueprint component.
 *
 * Deliberately UNFRAMED: the period, title, place, copy and tags read as one
 * column. The oversized index is a gradient watermark clipped by the lower-left
 * corner of the row, not a margin marker and not a logo tile.
 *
 * This file has no `'use client'`: both pages import it as a server component.
 * It has no hooks or Tina imports, so either usage is valid.
 */
export function ResumeEntryRow({
  entry,
  index,
  presentLabel,
}: {
  entry: HomeTimelineEntry;
  index: number;
  presentLabel: string;
}) {
  return (
    <li className="relative isolate overflow-hidden py-9 sm:py-12">
      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {entry.period ? (
            <span className="inline-flex items-center rounded-full border-2 border-ink/20 bg-sun/30 px-3 py-1 text-xs font-black text-amber-900 dark:border-sun/30 dark:bg-sun/15 dark:text-amber-200">
              {entry.period}
            </span>
          ) : null}

          {entry.current ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-blush/50 bg-blush/15 px-2.5 py-1 text-[0.65rem] font-black text-blush-text dark:border-blush/40 dark:bg-blush/20 dark:text-rose-200">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blush" />
              {presentLabel}
            </span>
          ) : null}
        </div>

        <h2 className="mt-3 text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.15] font-black tracking-tight text-balance">
          {entry.title}
        </h2>

        {entry.place ? (
          <p className="mt-2 text-sm font-bold text-ink/55 dark:text-slate-400">
            {entry.place}
          </p>
        ) : null}

        {entry.description ? (
          <p className="mt-4 max-w-3xl leading-relaxed text-ink/75 dark:text-slate-300">
            {entry.description}
          </p>
        ) : null}

        {entry.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-ink/15 bg-white/60 px-2.5 py-0.5 text-xs font-bold text-ink/65 dark:border-chalk/15 dark:bg-white/[0.06] dark:text-slate-300"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -left-2 z-0 bg-gradient-to-br from-iris via-blush to-sun bg-clip-text text-[clamp(6rem,12vw,9rem)] leading-[0.68] font-black tracking-[-0.08em] text-transparent opacity-45 select-none dark:from-indigo-300 dark:via-rose-300 dark:to-amber-200 dark:opacity-35"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    </li>
  );
}
