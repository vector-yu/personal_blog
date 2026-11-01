import type { HomeTimelineEntry } from '@/lib/home';

/**
 * One résumé row for the About page section (`/about#resume`). The homepage
 * timeline uses the shared data through its own blueprint component.
 *
 * Desktop keeps the original empty left margin. A large single-digit gradient
 * index sits inside that margin, fully visible; only its lower edge fades to
 * transparent against the row baseline. Mobile drops the empty margin and the
 * oversized number entirely; it keeps only a small muted index above the period
 * so the row stays simple and readable.
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
  const number = String(index + 1);
  const mobileNumber = number.padStart(2, '0');

  return (
    <li className="group relative isolate grid gap-5 py-9 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
      <div className="min-w-0 lg:col-start-2">
        <span
          aria-hidden
          className="mb-2 block font-mono text-sm font-black tracking-[0.22em] text-ink/30 tabular-nums lg:hidden dark:text-chalk/25"
        >
          {mobileNumber}
        </span>

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

      {/* Desktop index: a single numeral inside the blank margin. The wrapper
          is the row-sized container; the number scales to 60% of that cell so
          it never spills into the previous/next entry. Brand colour is intact;
          only the bottom of the element is masked to transparent. */}
      <span
        aria-hidden
        className="resume-index pointer-events-none absolute inset-0 z-0 hidden lg:block"
      >
        <span
          aria-hidden
          className="resume-index-number pointer-events-none absolute bottom-0 left-8 bg-gradient-to-t from-blush via-blush to-iris bg-clip-text px-2 py-4 leading-[1.2] font-black tracking-[-0.06em] text-transparent opacity-45 select-none dark:from-rose-300 dark:via-rose-300 dark:to-indigo-300 dark:opacity-40"
          style={{
            maskImage:
              'linear-gradient(to bottom, #000 0%, #000 38%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, #000 0%, #000 38%, transparent 100%)',
          }}
        >
          {number}
        </span>
      </span>
    </li>
  );
}
