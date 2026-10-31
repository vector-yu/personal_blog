'use client';

import { useEffect, useState } from 'react';

const SERIES_LENGTH = 18;

const INITIAL = {
  sig: 0.982,
  lat: 12.42,
  mem: 64.2,
  tick: 0,
  series: [
    0.38, 0.44, 0.4, 0.51, 0.47, 0.58, 0.54, 0.62, 0.58, 0.66, 0.61, 0.7, 0.67, 0.74,
    0.7, 0.79, 0.76, 0.84,
  ],
};

/**
 * A small drafting-console readout in the left margin.
 *
 * This is decorative chrome, not data: `aria-hidden`, no interaction. It is
 * shown only where the page has room for it (xl+) and only animates when the
 * caller allows motion. On reduced-motion it keeps the last static values.
 */
export function BlueprintTelemetry({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState(INITIAL);

  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      setData((previous) => {
        const next = Math.min(0.999, 0.91 + Math.random() * 0.08);
        return {
          sig: next,
          lat: 11.8 + Math.random() * 1.9,
          mem: 60 + Math.random() * 12,
          tick: previous.tick + 1,
          series: [...previous.series.slice(1), Math.random()],
        };
      });
    }, 1150);

    return () => window.clearInterval(interval);
  }, [enabled]);

  const points = data.series
    .map((value, index) => {
      const x = (index / (SERIES_LENGTH - 1)) * 80;
      const y = 24 - value * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastValue = data.series[data.series.length - 1];
  const lastPoint = {
    x: 80,
    y: 24 - lastValue * 20,
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[26%] left-6 z-[3] hidden w-32 xl:block"
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[0.52rem] tracking-[0.18em] text-ink/45 uppercase dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint motion-reduce:animate-none" />
          SYS / LIVE
        </span>
        <span>04</span>
      </div>

      <div className="mt-2.5 border-l border-dashed border-ink/20 pl-2.5 dark:border-chalk/15">
        <div className="flex items-baseline justify-between gap-2 font-mono text-[0.55rem] tracking-[0.12em] text-ink/45 uppercase dark:text-slate-400">
          <span>SIG</span>
          <span key={data.tick} className="hud-tick text-ink/75 tabular-nums dark:text-slate-200">
            {data.sig.toFixed(3)}
          </span>
        </div>

        <div className="mt-1 h-px w-full bg-ink/10 dark:bg-chalk/10">
          <div
            className="h-px bg-iris/70 transition-[width] duration-700 ease-out dark:bg-indigo-300/70"
            style={{ width: `${Math.round(data.sig * 100)}%` }}
          />
        </div>

        <svg
          viewBox="0 0 80 24"
          preserveAspectRatio="none"
          className="mt-2 h-6 w-full overflow-visible text-iris/65 dark:text-indigo-300/80"
          aria-hidden
        >
          <line
            x1="0"
            y1="23.5"
            x2="80"
            y2="23.5"
            stroke="currentColor"
            strokeWidth="0.4"
            opacity="0.25"
          />
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={lastPoint.x} cy={lastPoint.y} r="1.4" fill="currentColor" />
        </svg>

        <div className="mt-2 space-y-1.5 font-mono text-[0.55rem] tracking-[0.12em] text-ink/45 uppercase dark:text-slate-400">
          <div className="flex items-baseline justify-between gap-2">
            <span>LAT</span>
            <span key={`lat-${data.tick}`} className="hud-tick text-ink/75 tabular-nums dark:text-slate-200">
              {data.lat.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span>MEM</span>
            <span key={`mem-${data.tick}`} className="hud-tick text-ink/75 tabular-nums dark:text-slate-200">
              {data.mem.toFixed(1)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span>GRID</span>
            <span className="text-ink/65 tabular-nums dark:text-slate-300">24/120</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.18em] text-ink/30 uppercase dark:text-slate-500">
        <span className="h-px w-4 bg-current" />
        CAL / LOCK
      </div>
    </div>
  );
}
