'use client';

import Image from 'next/image';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  m,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { BlueprintTelemetry } from '@/components/home/blueprint-telemetry';
import {
  roundedPolyline,
  type BlueprintPoint as Point,
} from '@/components/home/blueprint-geometry';
import type { HomeTimelineEntry } from '@/lib/home';

type BlueprintLabels = {
  eyebrow: string;
  title: string;
  hint: string;
  end: string;
};

/**
 * The homepage résumé as a scroll-drawn technical sheet.
 *
 * The full résumé is in the document at all times: the cards are plain HTML,
 * always readable, and the blueprint line is decorative. Scroll only controls
 * how much of the line has been drawn and which node is lit. That keeps the
 * section safe for no-JS, reduced motion, crawlers and small screens.
 *
 * Desktop with motion: the sheet is pinned for one scroll track, the SVG path
 * draws through measured node centres, and a mouse spotlight/parallax shifts
 * the grid. Phones and reduced motion: no pinning, no scroll trap, a static
 * left rail and the same cards in normal flow.
 */
export function BlueprintTimeline({
  entries,
  emptyText,
  presentLabel,
  labels,
}: {
  entries: HomeTimelineEntry[];
  emptyText: string;
  presentLabel: string;
  labels: BlueprintLabels;
}) {
  // Start false on the server and on the first client render. Reading
  // `useReducedMotion()` directly here made the server render inactive cards
  // and the client render active ones, which React refuses to patch after
  // hydration. A local effect is the hydration-safe switch.
  const [staticMode, setStaticMode] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    setEnhanced(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 47.999rem)');
    const sync = () => setStaticMode(reduced.matches || mobile.matches);
    sync();
    reduced.addEventListener('change', sync);
    mobile.addEventListener('change', sync);
    return () => {
      reduced.removeEventListener('change', sync);
      mobile.removeEventListener('change', sync);
    };
  }, []);

  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const traceRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);
  const pathLengthRef = useRef(0);

  const [points, setPoints] = useState<Point[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(-1);
  const [hintVisible, setHintVisible] = useState(true);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  // The line starts drawing immediately and finishes at 92% of the track; the
  // last few percent give the final node a moment to settle before unpinning.
  const draw = useTransform(scrollYProgress, [0, 0.92], [0, 1]);
  const dashOffset = useTransform(draw, (value) => 1 - value);

  // ── Mouse: move the grid under the cards, never the cards themselves ──────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 22 });
  const spotX = useTransform(springX, [-1, 1], [18, 82]);
  const spotY = useTransform(springY, [-1, 1], [16, 84]);
  const spotlight = useMotionTemplate`radial-gradient(42rem circle at ${spotX}% ${spotY}%, rgb(109 92 255 / 0.11), transparent 62%)`;

  // ── Measure node centres so the SVG path meets the real DOM layout ───────
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const next = nodeRefs.current
        .filter((node): node is HTMLDivElement => Boolean(node))
        .map((node) => {
          const box = node.getBoundingClientRect();
          return {
            x: box.left - rect.left + box.width / 2,
            y: box.top - rect.top + box.height / 2,
          };
        });

      setSize({ width: rect.width, height: rect.height });
      setPoints(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    nodeRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [entries.length]);

  const geometry = buildPath(points, size);
  const path = geometry?.d ?? '';
  const nodeCount = Math.max(1, entries.length);

  // Cache the path length and move a small "drafting pen" along it. Updating
  // SVG attributes directly keeps this out of React's render loop.
  useLayoutEffect(() => {
    if (pathRef.current && path) {
      pathLengthRef.current = pathRef.current.getTotalLength();
    }
  }, [path]);

  const updateTip = (progress: number) => {
    if (staticMode) return;
    const group = tipRef.current;
    const svgPath = pathRef.current;
    if (!group || !svgPath || !pathLengthRef.current) return;

    const drawn = Math.min(1, Math.max(0, progress / 0.92));
    const point = svgPath.getPointAtLength(drawn * pathLengthRef.current);
    group.setAttribute('transform', `translate(${point.x} ${point.y})`);
    group.setAttribute('opacity', drawn > 0.01 && drawn < 0.995 ? '1' : '0');
  };
  // ── Active node: the line reaches a node at its measured Y fraction ───────
  const activeIndexFor = (progress: number) => {
    if (!points.length || !size.height) return -1;
    const drawn = Math.min(1, Math.max(0, progress / 0.92));
    let index = -1;
    points.forEach((point, i) => {
      if (drawn >= point.y / size.height) index = i;
    });
    return index;
  };

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = activeIndexFor(value);
    setActive((current) => (current === next ? current : next));
    setHintVisible((current) => {
      const show = value < 0.14;
      return current === show ? current : show;
    });
    updateTip(value);

    if (traceRef.current) {
      const percent = Math.round(Math.min(1, Math.max(0, value / 0.92)) * 100);
      traceRef.current.textContent = `${String(percent).padStart(2, '0')}%`;
    }
  });

  const updateFromCurrentScroll = () => {
    setActive(activeIndexFor(scrollYProgress.get()));
    setHintVisible(scrollYProgress.get() < 0.14);
    updateTip(scrollYProgress.get());
    if (traceRef.current) {
      const percent = Math.round(
        Math.min(1, Math.max(0, scrollYProgress.get() / 0.92)) * 100
      );
      traceRef.current.textContent = `${String(percent).padStart(2, '0')}%`;
    }
  };

  // Recalculate the active node after a layout change (fonts, resize).
  useLayoutEffect(() => {
    updateFromCurrentScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, size]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (staticMode) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const resetPointer = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const trackStyle = {
    '--blueprint-steps': nodeCount,
  } as CSSProperties;

  return (
    <section
      id="journey"
      ref={trackRef}
      style={trackStyle}
      data-enhanced={enhanced ? 'true' : 'false'}
      className="blueprint-track relative w-full"
    >
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        className="blueprint-stage mx-auto w-full max-w-7xl px-4 sm:px-6"
      >
        {/* --- blueprint sheet: grid, spotlight, orbit, corner marks -------- */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <m.div style={{ background: spotlight }} className="absolute inset-0" />

          {/* A faint technical orbit keeps the empty upper-right from reading
              as a plain background. It sits under the cards. */}
          <div className="absolute top-[15%] right-[5%] hidden h-[42vh] w-[42vh] rounded-full border border-dashed border-ink/10 lg:block dark:border-chalk/10">
            <div className="absolute inset-[12%] rounded-full border border-ink/10 dark:border-chalk/10" />
            <div className="absolute inset-[31%] rounded-full border border-ink/10 dark:border-chalk/10" />
            <span className="absolute top-1/2 left-0 h-px w-full bg-ink/10 dark:bg-chalk/10" />
            <span className="absolute top-0 left-1/2 h-full w-px bg-ink/10 dark:bg-chalk/10" />
          </div>

          {[
            'top-4 left-4',
            'top-4 right-4',
            'bottom-4 left-4',
            'bottom-4 right-4',
          ].map((position) => (
            <span
              key={position}
              className={`absolute ${position} font-mono text-sm leading-none text-ink/20 dark:text-chalk/20`}
            >
              +
            </span>
          ))}

          <span className="absolute top-1/2 left-4 hidden -translate-y-1/2 -rotate-90 font-mono text-[0.55rem] tracking-[0.3em] text-ink/20 sm:block dark:text-chalk/20">
            Y / CAREER
          </span>
          <span className="absolute bottom-4 left-1/2 hidden translate-x-6 font-mono text-[0.55rem] tracking-[0.3em] text-ink/20 sm:block dark:text-chalk/20">
            X / TIME
          </span>
        </div>

        <BlueprintTelemetry enabled={!staticMode} />

            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] hidden h-full w-full md:block"
              viewBox={`0 0 ${size.width} ${size.height}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="blueprint-line"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={size.height}
                >
                  <stop offset="0" stopColor="var(--color-iris)" />
                  <stop offset="0.55" stopColor="var(--color-blush)" />
                  <stop offset="1" stopColor="var(--color-sun)" />
                </linearGradient>

                {/* A soft white sheen slides along the fixed-colour line. The
                    hue never changes; only the light travels. */}
                <linearGradient
                  id="blueprint-sheen"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={size.height}
                >
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
                  <stop offset="0.58" stopColor="#fff" stopOpacity="0" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  {staticMode ? null : (
                    <animateTransform
                      attributeName="gradientTransform"
                      type="translate"
                      from={`0 -${size.height}`}
                      to={`0 ${size.height}`}
                      dur="16s"
                      repeatCount="indefinite"
                      className="motion-reduce:hidden"
                    />
                  )}
                </linearGradient>
                <filter id="blueprint-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {path ? (
                <>
                  <circle
                    cx={geometry?.start.x}
                    cy={geometry?.start.y}
                    r="2.5"
                    className="fill-iris/70"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeDasharray="5 9"
                    strokeLinejoin="round"
                    className="text-ink/15 dark:text-chalk/15"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#blueprint-line)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#blueprint-glow)"
                    vectorEffect="non-scaling-stroke"
                    className="hidden motion-reduce:block"
                  />
                  <m.path
                    ref={pathRef}
                    d={path}
                    fill="none"
                    stroke="url(#blueprint-line)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#blueprint-glow)"
                    pathLength={1}
                    strokeDasharray="1"
                    style={{ strokeDashoffset: dashOffset }}
                    vectorEffect="non-scaling-stroke"
                    className="motion-reduce:hidden"
                  />
                  {staticMode ? null : (
                    <m.path
                      d={path}
                      fill="none"
                      stroke="url(#blueprint-sheen)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                      style={{ strokeDashoffset: dashOffset }}
                      vectorEffect="non-scaling-stroke"
                      className="motion-reduce:hidden"
                    />
                  )}
                  <g
                    ref={tipRef}
                    opacity="0"
                    className="motion-reduce:hidden"
                    filter="url(#blueprint-glow)"
                  >
                    <circle r="10" className="fill-iris/25" />
                    <circle r="3.2" className="fill-iris" />
                    <circle r="1.3" className="fill-white/90" />
                  </g>
                </>
              ) : null}
            </svg>

        <div className="relative z-10 flex min-h-full flex-col py-6">
          <header className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[0.6rem] tracking-[0.3em] text-ink/40 uppercase dark:text-slate-500">
                {labels.eyebrow} <span className="text-iris-text dark:text-indigo-300">/</span>{' '}
                FIG. 01
              </p>
              <h2 className="mt-2 text-title">{labels.title}</h2>
            </div>

            <div className="hidden shrink-0 text-right font-mono text-[0.58rem] leading-relaxed tracking-[0.16em] text-ink/40 sm:block dark:text-slate-500">
              <p>SCALE 1:1</p>
              <p>REV / 01</p>
              <p className="motion-reduce:hidden">
                TRACE{' '}
                <span ref={traceRef} className="text-iris-text tabular-nums dark:text-indigo-300">
                  00%
                </span>
              </p>
            </div>
          </header>

          <div className="blueprint-body relative flex flex-1 flex-col justify-between py-6">
            {/* Desktop: the drawing. Mobile: a static left rail. */}
            <div
              aria-hidden
              className="absolute top-0 bottom-0 left-[1.625rem] w-px border-l border-dashed border-ink/25 md:hidden dark:border-chalk/25"
            />


            <ol className="blueprint-list relative z-10 flex h-full flex-col justify-between gap-6">
              {entries.length === 0 ? (
                <li className="my-auto py-16 text-center text-sm font-medium text-ink/60 dark:text-slate-400">
                  {emptyText}
                </li>
              ) : (
                entries.map((entry, index) => {
                  const side = index % 2 === 0 ? 'left' : 'right';
                  const isActive = staticMode || index <= active;
                  return (
                    <li
                      key={`${entry.period}-${entry.title}`}
                      className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-4 md:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] md:gap-8"
                    >
                      <div
                        ref={(node) => {
                          nodeRefs.current[index] = node;
                        }}
                        className="col-start-1 row-start-1 md:col-start-2 md:justify-self-center"
                      >
                        <BlueprintNode index={index} active={isActive} current={entry.current} />
                      </div>

                      <div
                        className={`col-start-2 row-start-1 min-w-0 md:row-start-1 ${
                          side === 'left'
                            ? 'md:col-start-1 md:justify-self-end'
                            : 'md:col-start-3 md:justify-self-start'
                        }`}
                      >
                        <BlueprintCard
                          entry={entry}
                          index={index}
                          side={side}
                          active={isActive}
                          presentLabel={presentLabel}
                        />
                      </div>
                    </li>
                  );
                })
              )}
            </ol>

            <div className="absolute right-1 bottom-0 hidden font-mono text-[0.55rem] tracking-[0.24em] text-ink/25 uppercase md:block dark:text-chalk/25">
              {labels.end}
            </div>
          </div>

          <div
            className={`blueprint-hint flex items-center justify-between gap-4 pt-2 font-mono text-[0.58rem] tracking-[0.2em] text-ink/35 uppercase transition-opacity duration-500 dark:text-slate-500 ${
              hintVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-iris" />
              {labels.hint}
            </span>
            <span className="hidden sm:block">N / {String(entries.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlueprintNode({
  index,
  active,
  current,
}: {
  index: number;
  active: boolean;
  current: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`blueprint-node relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 bg-paper transition-all duration-500 ${
        active
          ? 'border-iris text-iris-text shadow-[0_0_0_7px_rgb(109_92_255_/_0.11)] dark:border-iris/60 dark:bg-midnight dark:text-indigo-200'
          : 'border-ink/25 text-ink/45 dark:border-chalk/20 dark:bg-midnight dark:text-slate-400'
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-2 rounded-full border border-dashed border-current opacity-30"
      />
      <span className="font-mono text-[0.68rem] font-black tracking-tight tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Crosshair ticks, the small detail that makes it read as a drawing. */}
      <span className="absolute -top-2 left-1/2 h-2 w-px -translate-x-1/2 bg-current opacity-40" />
      <span className="absolute -bottom-2 left-1/2 h-2 w-px -translate-x-1/2 bg-current opacity-40" />
      <span className="absolute top-1/2 -left-2 h-px w-2 -translate-y-1/2 bg-current opacity-40" />
      <span className="absolute top-1/2 -right-2 h-px w-2 -translate-y-1/2 bg-current opacity-40" />

      {current ? (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blush dark:border-midnight" />
      ) : null}
    </div>
  );
}

function BlueprintCard({
  entry,
  index,
  side,
  active,
  presentLabel,
}: {
  entry: HomeTimelineEntry;
  index: number;
  side: 'left' | 'right';
  active: boolean;
  presentLabel: string;
}) {
  const align = side === 'left' ? 'md:text-right' : '';
  const tagsAlign = side === 'left' ? 'md:justify-end' : '';
  const tick = active ? 'border-iris/60' : 'border-ink/25 dark:border-chalk/20';

  return (
    <article
      className={`blueprint-card relative w-full max-w-[25rem] border bg-white/55 p-5 backdrop-blur-xl backdrop-saturate-125 transition-colors duration-500 md:w-[18rem] md:max-w-none lg:w-[25rem] dark:bg-white/[0.035] ${
        active
          ? 'border-iris/45 shadow-[0_20px_50px_-38px_rgb(109_92_255_/_0.75)]'
          : 'border-ink/15 dark:border-chalk/15'
      } ${align}`}
    >
      {/* Four corner ticks, like a callout on a technical sheet. */}
      <span aria-hidden className={`absolute -top-px -left-px h-2.5 w-2.5 border-t border-l ${tick}`} />
      <span aria-hidden className={`absolute -top-px -right-px h-2.5 w-2.5 border-t border-r ${tick}`} />
      <span aria-hidden className={`absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l ${tick}`} />
      <span aria-hidden className={`absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r ${tick}`} />

      <div className="flex items-center gap-2.5">
        {entry.logo ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md border border-ink/15 bg-white/70 p-1 dark:border-chalk/15 dark:bg-white/10">
            <Image
              src={entry.logo}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}
        <span className="font-mono text-[0.56rem] tracking-[0.22em] text-ink/40 uppercase dark:text-slate-500">
          NODE {String(index + 1).padStart(2, '0')}
        </span>
        <span className="h-px flex-1 bg-ink/15 dark:bg-chalk/15" />
        {entry.current ? (
          <span className="font-mono text-[0.55rem] tracking-[0.16em] text-blush-text uppercase dark:text-rose-300">
            {presentLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-mono text-[0.66rem] tracking-[0.08em] text-ink/60 tabular-nums dark:text-slate-400">
        {entry.period}
      </p>
      <h3 className="mt-1 text-xl leading-tight font-black tracking-tight">{entry.title}</h3>
      {entry.place ? (
        <p className="mt-1 text-xs font-bold text-ink/65 dark:text-slate-300">{entry.place}</p>
      ) : null}
      {entry.description ? (
        <p
          className={`mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70 dark:text-slate-300 ${
            side === 'left' ? 'md:ml-auto' : ''
          }`}
        >
          {entry.description}
        </p>
      ) : null}
      {entry.tags.length > 0 ? (
        <ul className={`mt-3 flex flex-wrap gap-1.5 ${tagsAlign}`}>
          {entry.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-ink/15 bg-white/50 px-2 py-0.5 font-mono text-[0.58rem] font-bold text-ink/70 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-300"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Leader line from the callout towards the central node. */}
      <span
        aria-hidden
        className={`absolute top-1/2 hidden h-px w-12 border-t md:block ${
          active ? 'border-iris/40' : 'border-ink/30 dark:border-chalk/30'
        } ${side === 'left' ? 'left-full' : 'right-full'}`}
      />
    </article>
  );
}

/** A rounded orthogonal drafting trace, with an entry/exit tail. */
function buildPath(points: Point[], size: { width: number; height: number }) {
  if (!points.length || !size.width || !size.height) return null;

  const startY = Math.max(8, points[0].y - 58);
  // Run the tail all the way to the bottom of the pinned sheet, so it can meet
  // the branch trunk that starts exactly at the next section.
  const endY = Math.max(points[points.length - 1].y + 58, size.height);
  const vertices: Point[] = [
    { x: points[0].x, y: startY },
    points[0],
  ];

  const detour = Math.min(60, size.width * 0.045);
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const direction = i % 2 === 0 ? 1 : -1;
    const shoulder = Math.min(48, (to.y - from.y) * 0.28);
    vertices.push(
      { x: from.x, y: from.y + shoulder },
      { x: from.x + direction * detour, y: from.y + shoulder },
      { x: from.x + direction * detour, y: to.y - shoulder },
      { x: to.x, y: to.y - shoulder },
      to
    );
  }

  vertices.push({ x: points[points.length - 1].x, y: endY });

  const d = roundedPolyline(vertices, 28);
  return { d, start: vertices[0], end: vertices[vertices.length - 1] };
}
