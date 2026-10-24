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
 * is `.zip-fabric`: a frosted-glass sheet that spans the whole viewport, split
 * down the middle into two halves clipped with a V whose apex follows the
 * slider. Above the apex the sheet is gone (the opening); below it the two
 * halves meet and the interlocked teeth cover the seam. Scrolling pulls the
 * slider down, the V widens, and the résumé comes out from underneath. The
 * glass is translucent and blurred, so the rows stay visible as soft shapes
 * even while they are still covered.
 *
 * There is deliberately no rounded/bordered container: the sheet is a sheet,
 * not a card, and the rows underneath are open (no card frames). The cloth ends
 * in a wavy hem that hangs below the stage (see `.curtain-hem`); the track root
 * uses `overflow-x-clip`, not `overflow-hidden`, so the hem is not cut flat while
 * the retracting halves still cannot create a horizontal scrollbar.
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
 * The sheet IS the stage: there is no separate collar band at the top (that
 * band used to leave a visible seam down the centre). The cloth continues 20px
 * above and 36px below the stage's bottom edge, where the mask turns it into a
 * hanging wave; the slider's closed track ends in a bottom stop just above it.
 * The slider is 84px tall;
 * its TOP is the V apex, so at progress 0 the apex is at the sheet's top edge
 * and the sheet is closed, and at progress 1 the slider's bottom rests on the
 * sheet's bottom edge. The tapes are rotated around the two top corners and
 * lengthen to the apex; their teeth are SVG tiles so they stay crisp at any
 * angle.
 */
const PULL_HEIGHT = 84;

export function ZipTimeline({
  entries,
  emptyText,
  presentLabel,
}: {
  entries: HomeTimelineEntry[];
  emptyText: string;
  presentLabel: string;
}) {
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

  const maxApex = useTransform(stageHeight, (value) => Math.max(0, value - PULL_HEIGHT));

  const apex = useTransform([progress, maxApex], ([value, limit]: number[]) =>
    Math.min(limit, Math.max(0, value * limit))
  );

  const apexPercent = useTransform([apex, stageHeight], ([value, height]: number[]) =>
    `${(value / Math.max(1, height)) * 100}%`
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

  // Keep the tapes hidden until the V has actually started to open. At
  // progress 0 they lie flat along the sheet's top edge and read as a
  // horizontal gold line; fading them in from 8% avoids that false reading.
  // There is deliberately NO end fade: the tapes leave with their half.
  const tapeOpacity = useTransform(progress, (value) => {
    if (value <= 0.08) return 0;
    if (value <= 0.12) return (value - 0.08) / 0.04;
    return 1;
  });

  // The ending is a CURTAIN PULL, not a fade. In the last 20% of the
  // progress the two halves (each with its collar, fabric and tape) slide
  // horizontally past opposite edges of the viewport. The closed track and
  // the slider ride with the right half, so the whole zipper leaves the
  // screen instead of a ghost being faded out.
  const retract = useTransform(progress, (value) =>
    value <= 0.8 ? 0 : Math.min(1, (value - 0.8) / 0.2)
  );
  const leftShift = useTransform([retract, stageWidth], ([value, width]: number[]) =>
    -value * width * 0.62
  );
  const rightShift = useTransform(leftShift, (value) => -value);

  const tapeLength = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    Math.max(1, Math.hypot(width / 2, value))
  );
  const leftRotate = useTransform([apex, stageWidth], ([value, width]: number[]) =>
    (-Math.atan2(width / 2, Math.max(value, 0.001)) * 180) / Math.PI
  );
  const rightRotate = useTransform(leftRotate, (value) => -value);

  return (
    <div ref={trackRef} className="relative w-full overflow-x-clip">
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

      {/* --- TOP LAYER: the full-bleed zippered sheet ---------------------- */}
      {active && measured ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 print:hidden">
          {/* LEFT HALF: collar + fabric + its open tape. The whole group is
              translated past the left edge of the viewport at the end. */}
          <m.div style={{ x: leftShift }} className="absolute inset-0">
            <div className="absolute inset-0 overflow-hidden">
              <m.div
                style={{ clipPath: leftClip }}
                className="zip-fabric absolute inset-0 backdrop-blur-xl backdrop-saturate-125"
              />
              <m.div
                style={{ height: tapeLength, rotate: leftRotate, opacity: tapeOpacity }}
                className="zipper-tape-left absolute top-0 -left-[13px] z-10 w-[26px] origin-top backdrop-blur-md backdrop-saturate-125"
              />
            </div>

            {/* The hanging hem is deliberately outside the clipping container:
                it starts 20px above the fabric's bottom and continues 36px
                below it, with a wavy mask and a shadow. Without it the sheet
                ends on a hard horizontal line at the stage/footer boundary. */}
            <div
              aria-hidden
              className="curtain-hem absolute -bottom-9 left-0 z-30 h-14 w-1/2 backdrop-blur-xl backdrop-saturate-125"
            />
          </m.div>

          {/* RIGHT HALF: collar + fabric + tape + the closed track and slider.
              The whole group is translated past the right edge of the viewport
              at the end, so the zipper leaves with it instead of fading. */}
          <m.div style={{ x: rightShift }} className="absolute inset-0">
            <div className="absolute inset-0 overflow-hidden">
              <m.div
                style={{ clipPath: rightClip }}
                className="zip-fabric absolute inset-0 backdrop-blur-xl backdrop-saturate-125"
              />
              <m.div
                style={{ height: tapeLength, rotate: rightRotate, opacity: tapeOpacity }}
                className="zipper-tape-right absolute top-0 -right-[13px] z-10 w-[26px] origin-top backdrop-blur-md backdrop-saturate-125"
              />

              {/* Interlocked track below the apex. */}
              <m.div
                style={{ clipPath: closedClip }}
                className="absolute inset-y-0 left-1/2 z-20 w-12 -translate-x-1/2"
              >
                <div className="zipper-closed h-full w-full" />
              </m.div>

              {/* The slider. Its TOP edge is the apex, so at rest the sheet is
                  completely closed; it rides the right half off the screen. */}
              <m.div
                style={{ top: apex }}
                className="absolute left-1/2 z-30 -translate-x-1/2"
              >
                <ZipperPull />
              </m.div>
            </div>

            {/* The hanging hem is deliberately outside the clipping container:
                it starts 20px above the fabric's bottom and continues 36px
                below it, with a wavy mask and a shadow. The left and right
                strips meet under the bottom stop. */}
            <div
              aria-hidden
              className="curtain-hem absolute -bottom-9 right-0 z-30 h-14 w-1/2 backdrop-blur-xl backdrop-saturate-125"
            />

            {/* Bottom stop: finishes the closed track instead of letting the
                teeth run into the hem. It rides with the right half. */}
            <span
              aria-hidden
              className="absolute bottom-1 left-1/2 z-40 h-3 w-12 -translate-x-1/2 rounded-full border-2 border-ink/30 bg-sun/90 shadow-brutal-xs backdrop-blur-md dark:border-chalk/20 dark:bg-sun/70"
            />
          </m.div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A frosted-glass slider, not a black-outlined metal pill.
 *
 * The old version had a full ink border and a dark jaw wedge at its top edge —
 * that wedge read as a black bar across the top of the zipper. Both are gone.
 * The body is a translucent glass capsule with a warm sun/blush tint, so the
 * page underneath stays visible through it; the finger slot and grip ridges
 * are the only darker details. It is aria-hidden because the sheet is
 * decorative.
 */
function ZipperPull() {
  return (
    <div className="relative h-[84px] w-[52px]">
      {/* No top border: the slider sits at the very top of the sheet, and a top
          edge there read as a dark bar across the zipper. The glass tint and
          the white inset highlight define the top instead. */}
      <div className="absolute inset-0 overflow-hidden rounded-[18px] border-x-2 border-b-2 border-t-0 border-ink/20 bg-white/35 shadow-glass backdrop-blur-xl backdrop-saturate-150 dark:border-chalk/15 dark:bg-white/[0.08]">
        {/* Warm glass tint, strongest at the top. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-sun/40 via-blush/15 to-transparent"
        />
        <span aria-hidden className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-white/60" />
        <span
          aria-hidden
          className="absolute top-5 left-1/2 h-8 w-3 -translate-x-1/2 rounded-full bg-ink/45 dark:bg-midnight/45"
        />
        <span aria-hidden className="absolute inset-x-3 bottom-6 block space-y-1.5">
          <span className="block h-1 rounded-full bg-ink/15" />
          <span className="block h-1 rounded-full bg-ink/15" />
          <span className="block h-1 rounded-full bg-ink/15" />
        </span>
        <span aria-hidden className="absolute inset-x-3 bottom-2 h-2 rounded-full bg-white/30" />
      </div>
      <span
        aria-hidden
        className="absolute -bottom-3 left-1/2 h-4 w-2 -translate-x-1/2 rounded-b-md border-x-2 border-b-2 border-ink/20 bg-white/40 backdrop-blur-md dark:border-chalk/15 dark:bg-white/10"
      />
    </div>
  );
}
