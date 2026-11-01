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
  const mobileNumber = String(index + 1).padStart(2, '0');

  return (
    <li className="group relative isolate grid gap-5 py-9 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
      <div
        aria-hidden
        className="hidden lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:items-start lg:gap-2 lg:pt-1"
      >
        <span className="flex items-center gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-ink/40 dark:text-chalk/35">
          <span aria-hidden className="h-1.5 w-1.5 border border-iris/60" />
          Node
        </span>
        <span aria-hidden className="h-px w-10 bg-ink/15 dark:bg-chalk/15" />
        <span className="resume-index-outline font-mono text-[clamp(4.5rem,6vw,5.5rem)] leading-none font-black tracking-[-0.08em] tabular-nums">
          {mobileNumber}
        </span>
      </div>

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
    </li>
  );
}
