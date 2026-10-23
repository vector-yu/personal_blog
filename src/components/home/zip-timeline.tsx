'use client';

import { useEffect, useRef, useState } from 'react';
import { m, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNoMotion } from '@/components/site/use-no-motion';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The résumé as a zippered bag.
 *
 * ── The two layers ──────────────────────────────────────────────────────────
 * The resume cards are the BOTTOM layer, in normal document flow. The TOP layer
 * is `.zip-fabric`: an opaque paper/midnight sheet split down the middle into
 * two halves, each clipped with a V whose apex follows the slider. Above the
 * apex the fabric is gone (that is the opening); below it the two halves meet
 * and the interlocked teeth cover the seam. So the page really is a bag with a
 * zipper: scrolling pulls the slider down, the V widens, and the resume comes
 * out from underneath.
 *
 * ── Why the slider stays put ────────────────────────────────────────────────
 * Progress runs from "stage top hits 80% of the viewport" to "stage bottom
 * hits 80%". The scroll distance therefore equals the stage height, while the
 * slider travels the same distance inside the stage — the two cancel, and the
 * slider stays at 80% of the viewport while the fabric moves up past it. That
 * is what makes it read as zipping the page open rather than as a decoration
 * scrolling away.
 *
 * ── Content safety ──────────────────────────────────────────────────────────
 * The cover is a progressive enhancement. It is not rendered until after
 * hydration, and never at all on phones / reduced motion (`useNoMotion`). The
 * cards are always in the HTML, so a no-JS visitor, a phone, or a crawler sees
 * the complete résumé with no cover in the way. This matters more here than
 * anywhere else on the site: the cover is opaque by design.
 *
 * ── Geometry ────────────────────────────────────────────────────────────────
 * The bag has a 56px collar at the top. The fabric lives below it. The slider
 * is 84px tall; its TOP is the V apex, so at progress 0 the apex is at the
 * fabric's top edge and the bag is completely closed, and at progress 1 the
 * slider's bottom rests on the fabric's bottom edge. The tapes are rotated
 * around the two top corners and lengthen to the apex; their teeth are SVG
 * tiles so they stay crisp at any angle.
 */
const COLLAR = 56;
const PULL_HEIGHT = 84;

export function ZipTimeline({ entries }: { entries: HomeTimelineEntry[] }) {
  const noMotion = useNoMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [measured, setMeasured] = useState(false);

  // Geometry is measured into MotionValues, not React state: the zipper runs on
  // every scroll frame, and re-rendering the eight cards for each one would be
  // wasteful. Only mount and "has been measured" need state.
  const stageWidth = useMotionValue(0);
  const stageHeight = useMotionValue(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const measure = () => {
      stageWidth.set(node.clientWidth);
      stageHeight.set(node.clientHeight);
      setMeasured(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [stageWidth, stageHeight]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.8', 'end 0.8'],
  });

  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  // MotionConfig cannot gate MotionValues that are driven directly, so the
  // no-motion branch swaps in a constant instead of merely ignoring the spring.
  const still = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const progress = noMotion ? still : smoothed;

  const active = mounted && !noMotion;

  const fabricHeight = useTransform(stageHeight, (value) => Math.max(1, value - COLLAR));
  const maxApex = useTransform(fabricHeight, (value) => Math.max(0, value - PULL_HEIGHT));

  const apex = useTransform([progress, maxApex], ([value, limit]: number[]) =>
    Math.min(limit, Math.max(0, value * limit))
  );

  const apexPercent = useTransform([apex, fabricHeight], ([value, height]: number[]) =>
    `${(value / height) * 100}%`
  );

  const leftClip = useTransform(
    apexPercent,
    (value) => `polygon(0 0, 0 100%, 50% 100%, 50% ${value}, 0 0)`
  );
  const rightClip = useTransform(
    apexPercent,
    (value) => `polygon(100% 0, 100% 100%, 50% 100%, 50% ${value}, 100% 0)`
  );
  const closedClip = useTransform(apexPercent, (value) => `inset(${value} 0 0 0)`);

  // Clamp the fade to an exact 0: the spring lags behind the raw scroll value,
  // so at the final pixel it can still sit at ~0.98 and leave a ghost of the
  // slider over the last card. `[0.84, 0.97]` + the snap removes that.
  const coverOpacity = useTransform(progress, (value) =>
    value >= 0.97 ? 0 : Math.min(1, Math.max(0, (0.97 - value) / (0.97 - 0.84)))
  );
  const tapeOpacity = useTransform(progress, (value) =>
    value <= 0.03 ? value / 0.03 : value >= 0.97 ? 0 : 1
  );

  const tapeLength = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    Math.max(1, Math.hypot(width / 2, value))
  );
  const leftRotate = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    (-Math.atan2(width / 2, Math.max(value, 0.001)) * 180) / Math.PI
  );
  const rightRotate = useTransform(leftRotate, (value) => -value);

  return (
    <div
      ref={trackRef}
      className={
        active
          ? 'relative mt-12 overflow-hidden rounded-[2rem] border-[3px] border-ink/85 bg-paper/40 shadow-brutal-xl dark:border-chalk/25 dark:bg-midnight/40 dark:shadow-chalk-lg'
          : 'relative mt-12'
      }
    >
      {/* --- BOTTOM LAYER: the résumé ------------------------------------- */}
      <ol
        className={
          active
            ? 'relative z-0 space-y-6 px-4 pt-14 pb-8 sm:px-6'
            : 'relative z-0 space-y-7'
        }
      >
        {entries.length === 0 ? (
          <li className="rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
            还没有履历条目。到 /admin 的「个人主页」里添加第一条吧。
          </li>
        ) : (
          entries.map((entry) => (
            <li key={`${entry.period}-${entry.title}`}>
              {/* A narrower card is deliberate: the V opening is widest at the
                  centre, so a centred column clears the fabric edge sooner and
                  the text is never sliced by the taper. */}
              <article className="group relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-[3px] border-ink/85 bg-white/65 p-6 shadow-brutal backdrop-blur-xl backdrop-saturate-125 md:w-[60%] dark:border-chalk/20 dark:bg-white/[0.045] dark:shadow-chalk">
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
          ))
        )}
      </ol>

      {/* --- TOP LAYER: the zippered fabric -------------------------------- */}
      {active && measured ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 print:hidden">
          <m.div style={{ opacity: coverOpacity }} className="absolute inset-0">
            {/* Collar: always closed, so the slider starts inside the bag. */}
            <div className="zip-fabric absolute inset-x-0 top-0 h-14" />

            {/* The zipper itself lives below the collar. */}
            <div
              className="absolute inset-x-0 bottom-0 overflow-hidden"
              style={{ top: COLLAR }}
            >
              {/* The two fabric halves. The V edge is exactly the tape centre. */}
              <m.div style={{ clipPath: leftClip }} className="zip-fabric absolute inset-0" />
              <m.div style={{ clipPath: rightClip }} className="zip-fabric absolute inset-0" />

              {/* Separated tapes above the apex, hinged at the top corners. */}
              <m.div
                style={{ height: tapeLength, rotate: leftRotate, opacity: tapeOpacity }}
                className="zipper-tape-left absolute top-0 -left-[13px] z-10 w-[26px] origin-top"
              />
              <m.div
                style={{ height: tapeLength, rotate: rightRotate, opacity: tapeOpacity }}
                className="zipper-tape-right absolute top-0 -right-[13px] z-10 w-[26px] origin-top"
              />

              {/* Interlocked track below the apex. */}
              <m.div
                style={{ clipPath: closedClip }}
                className="absolute inset-y-0 left-1/2 z-20 w-12 -translate-x-1/2"
              >
                <div className="zipper-closed h-full w-full" />
              </m.div>

              {/* The slider. Its TOP edge is the apex, so at rest the bag is
                  completely closed and at the end its bottom meets the bag. */}
              <m.div
                style={{ top: apex }}
                className="absolute left-1/2 z-30 -translate-x-1/2"
              >
                <ZipperPull />
              </m.div>
            </div>
          </m.div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A chunky sliders, drawn rather than iconified: gradient metal body, ink
 * outline, a finger slot and grip ridges, plus the little tab below. It is
 * aria-hidden because the whole cover is decorative.
 */
function ZipperPull() {
  return (
    <div className="relative h-[84px] w-[52px]">
      <div className="absolute inset-0 rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffe6a3,#ffd166_38%,#ffad7a)] shadow-[0_6px_0_0_#0b1221] dark:border-chalk dark:shadow-[0_6px_0_0_#e9eef8]">
        {/* Jaw: a dark wedge where the two tapes meet. */}
        <span
          aria-hidden
          className="absolute top-0 left-1/2 h-3 w-7 -translate-x-1/2 bg-ink/80 [clip-path:polygon(0_0,100%_0,50%_100%)] dark:bg-midnight/80"
        />
        <span aria-hidden className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-white/70" />
        <span
          aria-hidden
          className="absolute top-5 left-1/2 h-8 w-3 -translate-x-1/2 rounded-full bg-ink/80 dark:bg-midnight/80"
        />
        <span aria-hidden className="absolute inset-x-3 bottom-6 block space-y-1.5">
          <span className="block h-1 rounded-full bg-ink/20" />
          <span className="block h-1 rounded-full bg-ink/20" />
          <span className="block h-1 rounded-full bg-ink/20" />
        </span>
        <span aria-hidden className="absolute inset-x-3 bottom-2 h-2 rounded-full bg-white/40" />
      </div>
      <span
        aria-hidden
        className="absolute -bottom-3 left-1/2 h-4 w-2 -translate-x-1/2 rounded-b-md border-x-2 border-b-2 border-ink bg-sun dark:border-chalk"
      />
    </div>
  );
}
