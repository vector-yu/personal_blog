'use client';

import { useRef } from 'react';
import { m, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNoMotion } from '@/components/site/use-no-motion';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The résumé, presented as a zipper.
 *
 * ── How the trick works ─────────────────────────────────────────────────────
 * A vertical rail runs down the left of the list. Two copies of the teeth are
 * stacked and clipped against each other:
 *
 *   - the CLOSED strip is visible ABOVE the slider (clip from the top);
 *   - the OPEN strip is visible BELOW the slider (clip from the bottom), with
 *     the rainbow "lining" showing through the gap.
 *
 * That is how a real zipper behaves: the slider separates the track behind it.
 * The slider's `top` is a MotionValue driven by the section's scroll progress,
 * so it genuinely travels down as the visitor scrolls.
 *
 * ── Why content never depends on JavaScript ─────────────────────────────────
 * Only the RAIL is driven by Framer. The résumé entries are ordinary markup,
 * always present and always visible; their entrance is a CSS scroll-driven
 * animation (`.scroll-reveal`) that simply does nothing where it is unsupported.
 * No visitor can end up with an invisible résumé because a MotionValue stayed
 * at zero.
 *
 * ── Mobile ──────────────────────────────────────────────────────────────────
 * R1 says phones get no motion. `useNoMotion()` therefore jumps the rail to the
 * fully open state and removes the slider, while the responsive classes hide the
 * rail entirely below `md`; the entries keep their normal document flow. The
 * spring is never created on a phone because its target is a constant.
 */
export function ZipTimeline({ entries }: { entries: HomeTimelineEntry[] }) {
  const noMotion = useNoMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.72', 'end 0.88'],
  });

  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  // MotionConfig cannot gate directly-driven MotionValues, so the no-motion
  // branch swaps in constants instead of just ignoring the spring.
  const still = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const open = useTransform(scrollYProgress, [0, 1], [1, 1]);

  const progress = noMotion ? open : smoothed;
  const pullProgress = noMotion ? still : smoothed;

  const closedClip = useTransform(progress, (value) => `inset(${value * 100}% 0 0 0)`);
  const openClip = useTransform(progress, (value) => `inset(0 0 ${(1 - value) * 100}% 0)`);
  const pullTop = useTransform(
    pullProgress,
    (value) => `calc(${value * 100}% - ${value * 64}px)`
  );

  return (
    <div ref={trackRef} className="relative mt-12">
      {/* --- the zipper rail (desktop only) --------------------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-2 hidden w-10 md:block"
      >
        {/* Open below the slider: separated teeth + the coloured lining. */}
        <m.div style={{ clipPath: openClip }} className="absolute inset-0">
          <div className="zipper-open-left absolute inset-y-0 left-0 w-[18px]" />
          <div className="zipper-open-right absolute inset-y-0 right-0 w-[18px]" />
          <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-iris via-blush to-sun opacity-90" />
        </m.div>

        {/* Closed above the slider: interlocking teeth. */}
        <m.div style={{ clipPath: closedClip }} className="absolute inset-0">
          <div className="zipper-closed absolute inset-0" />
        </m.div>

        {/* The slider itself. Removed entirely when motion is off. */}
        {noMotion ? null : (
          <m.div
            style={{ top: pullTop }}
            className="absolute left-1/2 z-20 -translate-x-1/2"
          >
            <div className="relative h-16 w-10 rounded-2xl border-[3px] border-ink bg-gradient-to-b from-sun via-sun to-blush shadow-brutal-sm dark:border-chalk dark:shadow-chalk-sm">
              <span className="absolute top-2.5 left-1/2 h-5 w-2.5 -translate-x-1/2 rounded-full bg-ink/80 dark:bg-midnight/80" />
              <span className="absolute inset-x-1.5 bottom-2 h-1 rounded-full bg-white/60" />
            </div>
            <span className="absolute -bottom-2 left-1/2 h-3 w-1.5 -translate-x-1/2 rounded-b-sm bg-ink dark:bg-chalk" />
          </m.div>
        )}
      </div>

      {/* --- the résumé ----------------------------------------------------- */}
      {entries.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有履历条目。到 /admin 的「个人主页」里添加第一条吧。
        </p>
      ) : (
        <ol className="space-y-7 md:pl-20">
          {entries.map((entry) => (
            <li
              key={`${entry.period}-${entry.title}`}
              className="scroll-reveal relative"
            >
              {/* connector into the rail */}
              <span
                aria-hidden
                className="absolute top-8 -left-[3.75rem] hidden h-4 w-4 rounded-full border-[3px] border-ink bg-mint shadow-brutal-xs md:block dark:border-chalk"
              />
              <span
                aria-hidden
                className="absolute top-[2.55rem] -left-[2.75rem] hidden h-0.5 w-11 bg-ink/25 md:block dark:bg-chalk/25"
              />

              <article className="group relative overflow-hidden rounded-2xl border-[3px] border-ink/85 bg-white/65 p-6 shadow-brutal backdrop-blur-xl backdrop-saturate-125 dark:border-chalk/20 dark:bg-white/[0.045] dark:shadow-chalk">
                {/* Gradient spine for the current entry; a quiet rule otherwise. */}
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-1.5 ${
                    entry.current
                      ? 'bg-gradient-to-b from-iris via-blush to-sun'
                      : 'bg-ink/10 dark:bg-chalk/10'
                  }`}
                />

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {entry.period ? (
                      <span className="inline-flex items-center rounded-full border-2 border-ink/20 bg-sun/40 px-3 py-1 text-xs font-black text-amber-900 dark:border-sun/30 dark:bg-sun/15 dark:text-amber-200">
                        {entry.period}
                      </span>
                    ) : null}

                    {entry.current ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-blush/50 bg-blush/15 px-3 py-1 text-xs font-black text-blush-text dark:border-blush/40 dark:bg-blush/20 dark:text-rose-200">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blush" />
                        现在
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3.5 text-title">{entry.title}</h3>

                  {entry.place ? (
                    <p className="mt-1.5 text-sm font-bold text-ink/55 dark:text-slate-400">
                      {entry.place}
                    </p>
                  ) : null}

                  {entry.description ? (
                    <p className="mt-3.5 leading-relaxed text-ink/75 dark:text-slate-300">
                      {entry.description}
                    </p>
                  ) : null}

                  {entry.tags.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs font-bold text-ink/65 dark:border-chalk/15 dark:bg-white/[0.06] dark:text-slate-300"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
