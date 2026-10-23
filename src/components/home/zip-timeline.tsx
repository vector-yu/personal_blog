'use client';

import { useEffect, useRef, useState } from 'react';
import { m, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNoMotion } from '@/components/site/use-no-motion';
import { ResumeEntryRow } from '@/components/home/resume-entry';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The résumé as a full-bleed zippered sheet.
 *
 * ── The two layers ──────────────────────────────────────────────────────────
 * The résumé rows are the BOTTOM layer, in normal document flow. The TOP layer
 * is `.zip-fabric`: an opaque paper/midnight sheet that spans the whole
 * viewport, split down the middle into two halves clipped with a V whose apex
 * follows the slider. Above the apex the sheet is gone (the opening); below it
 * the two halves meet and the interlocked teeth cover the seam. Scrolling pulls
 * the slider down, the V widens, and the résumé comes out from underneath.
 *
 * There is deliberately no rounded/bordered container: the sheet is a sheet,
 * not a card, and the rows underneath are open (no card frames).
 *
 * ── Why the slider stays put ────────────────────────────────────────────────
 * Progress runs from "stage top hits 80% of the viewport" to "stage bottom
 * hits 80%". The scroll distance therefore equals the stage height, while the
 * slider travels the same distance inside the stage — the two cancel, and the
 * slider stays near the bottom of the viewport while the fabric moves up past
 * it. That is what makes it read as zipping the page open rather than as a
 * decoration scrolling away.
 *
 * ── Content safety ──────────────────────────────────────────────────────────
 * The sheet is a progressive enhancement. It is not rendered until after
 * hydration, and never at all on phones / reduced motion (`useNoMotion`). The
 * rows are always in the HTML, so a no-JS visitor, a phone, or a crawler sees
 * the complete résumé with no sheet in the way. The /resume page renders the
 * same rows with no client code at all.
 *
 * ── Geometry ────────────────────────────────────────────────────────────────
 * The sheet has a 56px collar at the top. The fabric lives below it. The slider
 * is 84px tall; its TOP is the V apex, so at progress 0 the apex is at the
 * fabric's top edge and the sheet is closed, and at progress 1 the slider's
 * bottom rests on the sheet's bottom edge. The tapes are rotated around the two
 * top corners and lengthen to the apex; their teeth are SVG tiles so they stay
 * crisp at any angle.
 */
const COLLAR = 56;
const PULL_HEIGHT = 84;

export function ZipTimeline({ entries }: { entries: HomeTimelineEntry[] }) {
  const noMotion = useNoMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [measured, setMeasured] = useState(false);

  // Geometry is measured into MotionValues, not React state: the zipper runs on
  // every scroll frame, and re-rendering the rows for each one would be
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
  // slider over the last row. `[0.84, 0.97]` + the snap removes that.
  const coverOpacity = useTransform(progress, (value) =>
    value >= 0.97 ? 0 : Math.min(1, Math.max(0, (0.97 - value) / (0.97 - 0.84)))
  );
  // Keep the tapes hidden until the V has actually started to open. At
  // progress 0 they lie flat along the sheet's top edge and read as a
  // horizontal gold line; fading them in from 8% avoids that false reading.
  const tapeOpacity = useTransform(progress, (value) => {
    if (value <= 0.08) return 0;
    if (value <= 0.12) return (value - 0.08) / 0.04;
    return value >= 0.97 ? 0 : 1;
  });

  const tapeLength = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    Math.max(1, Math.hypot(width / 2, value))
  );
  const leftRotate = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    (-Math.atan2(width / 2, Math.max(value, 0.001)) * 180) / Math.PI
  );
  const rightRotate = useTransform(leftRotate, (value) => -value);

  return (
    <div ref={trackRef} className="relative w-full overflow-hidden">
      {/* --- BOTTOM LAYER: the résumé, open and unframed ------------------- */}
      <ol
        className={
          active
            ? 'relative z-0 mx-auto w-full max-w-7xl divide-y-2 divide-dashed divide-ink/15 px-6 pt-14 pb-4 dark:divide-chalk/15'
            : 'relative z-0 mx-auto w-full max-w-7xl divide-y-2 divide-dashed divide-ink/15 px-6 dark:divide-chalk/15'
        }
      >
        {entries.length === 0 ? (
          <li className="py-14 text-center text-sm font-medium text-ink/60 dark:text-slate-400">
            还没有履历条目。到 /admin 的「个人主页」里添加第一条吧。
          </li>
        ) : (
          entries.map((entry, index) => (
            <ResumeEntryRow
              key={`${entry.period}-${entry.title}`}
              entry={entry}
              index={index}
            />
          ))
        )}
      </ol>

      {/* --- TOP LAYER: the full-bleed zippered sheet ---------------------- */}
      {active && measured ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 print:hidden">
          <m.div style={{ opacity: coverOpacity }} className="absolute inset-0">
            {/* Collar: always closed, so the slider starts inside the sheet. */}
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

              {/* The slider. Its TOP edge is the apex, so at rest the sheet is
                  completely closed and at the end its bottom meets the sheet. */}
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
 * A chunky slider, drawn rather than iconified: gradient metal body, ink
 * outline, a finger slot and grip ridges, plus the little tab below. It is
 * aria-hidden because the whole sheet is decorative.
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
