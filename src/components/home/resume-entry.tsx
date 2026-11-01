import type { HomeTimelineEntry } from '@/lib/home';

/**
 * One résumé row for the About page section (`/about#resume`). The homepage
 * timeline uses the shared data through its own blueprint component.
 *
 * Desktop keeps the original empty left margin. The oversized gradient index
 * sits at the bottom-left, behind the copy, so the content covers part of it
 * naturally — it is not clipped by an overflow box. Mobile drops the empty
 * margin and the oversized number entirely; it keeps only a small muted index
 * above the period so the row stays simple and readable.
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
  const number = String(index + 1).padStart(2, '0');

  return (
    <li className="group relative isolate grid gap-5 py-9 lg:min-h-[14rem] lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
      {/* Desktop keeps the original blank margin and its current-entry spine.
          Below lg the row is a single mobile column and this is hidden. */}
      {entry.current ? (
        <span
          aria-hidden
          className="absolute inset-y-10 left-0 z-0 hidden w-1 rounded-full bg-gradient-to-b from-iris via-blush to-sun lg:block lg:inset-y-12"
        />
      ) : null}

      <div className="min-w-0 lg:col-start-2">
        <span
          aria-hidden
          className="mb-2 block font-mono text-sm font-black tracking-[0.22em] text-ink/30 tabular-nums lg:hidden dark:text-chalk/25"
        >
          {number}
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

      {/* The number is fully inside the row; no overflow clipping. Its right
          side runs under the copy column and is covered by the content. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden bg-gradient-to-br from-iris via-blush to-sun bg-clip-text text-[clamp(9rem,22vw,16rem)] leading-[0.68] font-black tracking-[-0.08em] text-transparent opacity-45 select-none lg:block dark:from-indigo-300 dark:via-rose-300 dark:to-amber-200 dark:opacity-35"
      >
        {number}
      </span>
    </li>
  );
}
