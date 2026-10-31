import Image from 'next/image';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * One résumé row, shared by the homepage list and the About page section
 * (`/about#resume`).
 *
 * Deliberately UNFRAMED: a big index in the left margin, then the period,
 * title, place, copy and tags laid out across the page. The period lives with
 * the title rather than in the far-left margin so the eye reads it before the
 * title; the index and optional logo are decorative.
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
    <li className="group relative grid gap-5 py-10 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-10 md:grid-cols-[12rem_minmax(0,1fr)] md:py-12">
      {/* A gradient spine marks the current entry without boxing it. */}
      {entry.current ? (
        <span
          aria-hidden
          className="absolute inset-y-10 left-0 w-1 rounded-full bg-gradient-to-b from-iris via-blush to-sun sm:inset-y-12"
        />
      ) : null}

      {/* Decorative index (and optional school/company logo) in the margin. */}
      <div className="flex items-center gap-3 pl-1 sm:flex-col sm:items-start sm:gap-4 sm:pl-5">
        {entry.logo ? (
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-ink/15 bg-white/80 p-2 shadow-brutal-xs backdrop-blur dark:border-chalk/15 dark:bg-white/10 dark:shadow-chalk-xs">
            <Image
              src={entry.logo}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}
        <span className="text-sm font-black tracking-[0.22em] text-ink/30 tabular-nums dark:text-chalk/25">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="min-w-0">
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
