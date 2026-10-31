'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { roundedPolyline, type BlueprintPoint as Point } from '@/components/home/blueprint-geometry';

export type BranchCard = {
  title: string;
  description: string;
  href: string;
  kicker: string;
};

type BranchLabels = {
  open: string;
};

/**
 * The bottom of the blueprint: the drafting line reaches a bus and splits into
 * three labeled routes (About / Start here / Notes). There is no separate
 * heading: the line arrives directly from the résumé sheet above, so the two
 * parts read as one drawing.
 *
 * The cards are ordinary links in the server HTML; the SVG is decorative and is
 * only measured after mount. On phones the line is hidden and the cards stack,
 * so the three destinations never depend on the drawing.
 */
export function BlueprintBranches({
  cards,
  labels,
}: {
  cards: BranchCard[];
  labels: BranchLabels;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 47.999rem)');
    const sync = () => setReduceMotion(reduced.matches || mobile.matches);
    sync();
    reduced.addEventListener('change', sync);
    mobile.addEventListener('change', sync);
    return () => {
      reduced.removeEventListener('change', sync);
      mobile.removeEventListener('change', sync);
    };
  }, []);

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
  }, [cards.length]);

  const branch = buildBranch(points, size);

  return (
    <section
      className="blueprint-branches relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6"
    >
      <div ref={stageRef} className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="branch-flow"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2={size.height}
            >
              <stop offset="0" stopColor="var(--color-sun)" />
              <stop offset="0.5" stopColor="var(--color-blush)" />
              <stop offset="1" stopColor="var(--color-iris)" />
            </linearGradient>

            <linearGradient
              id="branch-sheen"
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
              {reduceMotion ? null : (
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
            <filter id="branch-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {branch ? (
            <>
              <path
                d={branch.d}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 9"
                strokeLinejoin="round"
                className="text-ink/15 dark:text-chalk/15"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={branch.d}
                fill="none"
                stroke="url(#branch-flow)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#branch-glow)"
                vectorEffect="non-scaling-stroke"
              />
              {reduceMotion ? null : (
                <path
                  d={branch.d}
                  fill="none"
                  stroke="url(#branch-sheen)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="motion-reduce:hidden"
                />
              )}
              <rect
                x={branch.busX - 5}
                y={branch.busY - 5}
                width="10"
                height="10"
                transform={`rotate(45 ${branch.busX} ${branch.busY})`}
                className="fill-paper stroke-iris dark:fill-midnight"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </svg>

        <div className="relative z-10 grid gap-8 pt-4 md:grid-cols-3 md:gap-6 md:pt-40">
          {cards.map((card, index) => (
            <div key={card.href} className="group flex flex-col items-center">
              <div
                ref={(node) => {
                  nodeRefs.current[index] = node;
                }}
              >
                <BranchNode index={index} />
              </div>

              <Link
                href={card.href}
                className="blueprint-card relative mt-4 flex w-full flex-col border border-ink/15 bg-white/55 p-5 text-left backdrop-blur-xl backdrop-saturate-125 transition-all duration-300 hover:-translate-y-1 hover:border-iris/50 hover:shadow-[0_22px_50px_-32px_rgb(109_92_255_/_0.65)] focus-visible:ring-2 focus-visible:ring-iris focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.035]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[0.56rem] tracking-[0.22em] text-ink/45 uppercase dark:text-slate-400">
                    BRANCH {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="h-px flex-1 bg-ink/15 dark:bg-chalk/15" />
                  <span className="font-mono text-[0.52rem] tracking-[0.16em] text-iris-text uppercase dark:text-indigo-300">
                    {card.kicker}
                  </span>
                </div>

                <h3 className="mt-4 text-xl leading-tight font-black tracking-tight">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-slate-300">
                  {card.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-mono text-[0.58rem] font-bold tracking-[0.18em] text-ink/55 uppercase transition-colors group-hover:text-iris-text dark:text-slate-400 dark:group-hover:text-indigo-300">
                  {labels.open}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                  >
                    →
                  </span>
                </span>

                <span
                  aria-hidden
                  className="absolute -top-px -left-px h-2.5 w-2.5 border-t border-l border-ink/25 transition-colors group-hover:border-iris/60 dark:border-chalk/20"
                />
                <span
                  aria-hidden
                  className="absolute -top-px -right-px h-2.5 w-2.5 border-t border-r border-ink/25 transition-colors group-hover:border-iris/60 dark:border-chalk/20"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-ink/25 transition-colors group-hover:border-iris/60 dark:border-chalk/20"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-ink/25 transition-colors group-hover:border-iris/60 dark:border-chalk/20"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BranchNode({ index }: { index: number }) {
  return (
    <div
      aria-hidden
      className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-iris bg-paper text-iris-text shadow-[0_0_0_7px_rgb(109_92_255_/_0.10)] transition-colors duration-300 group-hover:border-iris group-hover:bg-white dark:border-iris/60 dark:bg-midnight dark:text-indigo-200 dark:group-hover:bg-white/[0.07]"
    >
      <span className="absolute inset-2 rounded-full border border-dashed border-current opacity-30" />
      <span className="font-mono text-[0.68rem] font-black tracking-tight tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="absolute -top-2 left-1/2 h-2 w-px -translate-x-1/2 bg-current opacity-40" />
      <span className="absolute -bottom-2 left-1/2 h-2 w-px -translate-x-1/2 bg-current opacity-40" />
      <span className="absolute top-1/2 -left-2 h-px w-2 -translate-y-1/2 bg-current opacity-40" />
      <span className="absolute top-1/2 -right-2 h-px w-2 -translate-y-1/2 bg-current opacity-40" />
    </div>
  );
}

/** A trunk, one horizontal bus, and three drops to the measured card nodes. */
function buildBranch(points: Point[], size: { width: number; height: number }) {
  if (points.length < 3 || !size.width || !size.height) return null;

  const left = points[0];
  const middle = points[1];
  const right = points[2];
  const busY = Math.max(44, Math.min(left.y, middle.y, right.y) - 88);
  const busX = middle.x;

  // Trunk + two halves of the bus, then a rounded outer elbow at each end.
  // The centre T is covered by the diamond below, the same way a drafting
  // drawing hides a sharp junction under a marker.
  const trunk = roundedPolyline(
    [
      { x: middle.x, y: 0 },
      { x: middle.x, y: busY },
    ],
    8
  );
  const leftBranch = roundedPolyline(
    [
      { x: middle.x, y: busY },
      { x: left.x, y: busY },
      { x: left.x, y: left.y },
    ],
    34
  );
  const rightBranch = roundedPolyline(
    [
      { x: middle.x, y: busY },
      { x: right.x, y: busY },
      { x: right.x, y: right.y },
    ],
    34
  );
  const centerBranch = roundedPolyline(
    [
      { x: middle.x, y: busY },
      { x: middle.x, y: middle.y },
    ],
    8
  );

  return { d: `${trunk} ${leftBranch} ${rightBranch} ${centerBranch}`, busX, busY };
}
