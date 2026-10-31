'use client';

import { useEffect, useRef } from 'react';

const CELL = 120; // the major grid line spacing in globals.css
const MAX_STREAKS = 2;
const TRAIL = 60;
const COLORS = ['109,92,255', '239,123,160', '255,209,102'] as const;

type Direction = 'up' | 'down' | 'left' | 'right';

type Point = { x: number; y: number };

type Streak = {
  x: number;
  y: number;
  target: Point;
  dir: Direction;
  speed: number;
  life: number;
  maxLife: number;
  history: Point[];
  color: string;
  strength: number;
};

const DELTA: Record<Direction, Point> = {
  right: { x: CELL, y: 0 },
  left: { x: -CELL, y: 0 },
  down: { x: 0, y: CELL },
  up: { x: 0, y: -CELL },
};

const TURN_LEFT: Record<Direction, Direction> = {
  right: 'up',
  up: 'left',
  left: 'down',
  down: 'right',
};

const TURN_RIGHT: Record<Direction, Direction> = {
  right: 'down',
  down: 'left',
  left: 'up',
  up: 'right',
};

const DIRECTIONS: Direction[] = ['right', 'left', 'down', 'up'];

/**
 * Decorative light points that travel along the blueprint's major grid lines,
 * leaving a short tail and occasionally turning 90° at an intersection.
 *
 * The hero requests `dense` so its first screen gets a little more life; the
 * résumé field keeps the calmer default.
 * Kept on a 2D canvas (rather than dozens of DOM nodes):
 *  - the canvas is transparent, non-interactive and behind the cards;
 *  - it only runs while the section is in view and the tab is visible;
 *  - prefers-reduced-motion and phones get no canvas animation at all;
 *  - no-JS leaves it empty.
 */
export function GridStreaks({
  active,
  dense = false,
}: {
  active: boolean;
  dense?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const maxStreaks = dense ? 3 : MAX_STREAKS;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 47.999rem)');
    if (reduce.matches || mobile.matches) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let streaks: Streak[] = [];
    let elapsed = 0;
    let nextSpawn = 0.8;
    let running = false;
    let inView = true;
    let raf = 0;
    let last = 0;

    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    const validTarget = (x: number, y: number, dir: Direction) => {
      const nx = x + DELTA[dir].x;
      const ny = y + DELTA[dir].y;
      return nx >= 0 && nx <= width && ny >= 0 && ny <= height;
    };

    const nextDirection = (streak: Streak): Direction | null => {
      const candidates: { dir: Direction; weight: number }[] = [
        { dir: streak.dir, weight: 0.64 },
        { dir: TURN_LEFT[streak.dir], weight: 0.18 },
        { dir: TURN_RIGHT[streak.dir], weight: 0.18 },
      ].filter((candidate) => validTarget(streak.x, streak.y, candidate.dir));

      if (!candidates.length) return null;
      const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
      let roll = Math.random() * total;
      for (const candidate of candidates) {
        roll -= candidate.weight;
        if (roll <= 0) return candidate.dir;
      }
      return candidates[candidates.length - 1].dir;
    };

    const spawn = () => {
      const cols = Math.max(1, Math.floor(width / CELL));
      const rows = Math.max(1, Math.floor(height / CELL));
      if (cols < 2 || rows < 2) return;

      const x = Math.round(random(1, cols - 1)) * CELL;
      const y = Math.round(random(1, rows - 1)) * CELL;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        if (!validTarget(x, y, dir)) continue;
        const life = random(9, 15);
        streaks.push({
          x,
          y,
          target: { x: x + DELTA[dir].x, y: y + DELTA[dir].y },
          dir,
          speed: random(68, 118),
          life,
          maxLife: life,
          history: [{ x, y }],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          strength: random(0.65, 1),
        });
        return;
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      streaks = [];
      elapsed = 0;
      nextSpawn = dense ? 0.2 : 0.8;
    };

    const drawTail = (streak: Streak, alpha: number) => {
      for (let i = 1; i < streak.history.length; i += 1) {
        const from = streak.history[i - 1];
        const to = streak.history[i];
        const t = i / streak.history.length;
        ctx.strokeStyle = `rgba(${streak.color},${(t * alpha).toFixed(3)})`;
        ctx.lineWidth = 1 + t * 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    };

    const drawHead = (streak: Streak, alpha: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(streak.x, streak.y, 0, streak.x, streak.y, 22);
      glow.addColorStop(0, `rgba(${streak.color},${(alpha * 0.8).toFixed(3)})`);
      glow.addColorStop(0.35, `rgba(${streak.color},${(alpha * 0.2).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(streak.x, streak.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(streak.x, streak.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const step = (dt: number) => {
      elapsed += dt;
      const boost = isDark() ? 1 : 0.72;

      if (streaks.length < maxStreaks && elapsed >= nextSpawn) {
        spawn();
        nextSpawn = elapsed + (dense ? random(2.2, 4.2) : random(4, 7.5));
      }

      streaks = streaks.filter((streak) => streak.life > 0);

      for (const streak of streaks) {
        streak.life -= dt;

        const dx = streak.target.x - streak.x;
        const dy = streak.target.y - streak.y;
        const distance = Math.hypot(dx, dy);
        const travel = streak.speed * dt;

        if (distance <= travel || distance < 0.5) {
          streak.x = streak.target.x;
          streak.y = streak.target.y;
          const dir = nextDirection(streak);
          if (!dir) {
            streak.life = 0;
            continue;
          }
          streak.dir = dir;
          streak.target = {
            x: streak.x + DELTA[dir].x,
            y: streak.y + DELTA[dir].y,
          };
        } else {
          streak.x += (dx / distance) * travel;
          streak.y += (dy / distance) * travel;
        }

        if (streak.life <= 0) continue;

        const previous = streak.history[streak.history.length - 1];
        if (!previous || Math.hypot(streak.x - previous.x, streak.y - previous.y) > 1.2) {
          streak.history.push({ x: streak.x, y: streak.y });
          if (streak.history.length > TRAIL) streak.history.shift();
        }

        const fadeIn = Math.min(1, (streak.maxLife - streak.life) / 1.1);
        const fadeOut = Math.min(1, streak.life / 1.8);
        const alpha = streak.strength * fadeIn * fadeOut * boost;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawTail(streak, alpha);
        drawHead(streak, alpha);
      }

      const before = streaks.length;
      streaks = streaks.filter((streak) => streak.life > 0);
      if (before > 0 && streaks.length < before) {
        nextSpawn = Math.max(
          nextSpawn,
          elapsed + (dense ? random(1.2, 2.6) : random(1.5, 3.5))
        );
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      ctx.clearRect(0, 0, width, height);
      step(dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const syncMotion = () => {
      if (reduce.matches || mobile.matches) {
        stop();
        ctx.clearRect(0, 0, width, height);
      } else if (inView && !document.hidden) {
        start();
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else syncMotion();
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 }
    );
    intersection.observe(canvas.parentElement ?? canvas);

    reduce.addEventListener('change', syncMotion);
    mobile.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', onVisibility);
    syncMotion();

    return () => {
      stop();
      observer.disconnect();
      intersection.disconnect();
      reduce.removeEventListener('change', syncMotion);
      mobile.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', onVisibility);
      ctx.clearRect(0, 0, width, height);
    };
  }, [active, dense]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full md:block motion-reduce:hidden"
    />
  );
}
