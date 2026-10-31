'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { m, useScroll, useTransform } from 'framer-motion';

type HeroToken = { text: string; space: boolean };

/**
 * Split the site name into word-sized pieces for the masked reveal.
 *
 * We deliberately do NOT split every CJK character: per-character bouncing
 * looks like a template. Spaces are preserved as text nodes; very long words
 * are cut into 5-character chunks so they can wrap without overflowing.
 */
function splitIdentity(value: string): HeroToken[] {
  return value
    .split(/(\s+)/)
    .filter(Boolean)
    .flatMap((part): HeroToken[] => {
      if (/^\s+$/.test(part)) return [{ text: part, space: true }];
      if (part.length <= 10) return [{ text: part, space: false }];
      const chunks = part.match(/.{1,5}/gu) ?? [part];
      return chunks.map((text) => ({ text, space: false }));
    });
}

/**
 * The first screen: a small drafting sheet rather than a static poster.
 *
 * On load a frame draws, the name wipes in by word, then the motto and the
 * colour strip settle. On a desktop with motion, a faint crosshair follows the
 * pointer, the title moves by a couple of pixels, and the whole sheet recedes
 * gently on scroll. Phones and reduced motion get the composed end state only.
 */
export function HomeHero({
  siteName,
  tagline,
  scrollHint,
}: {
  siteName: string;
  tagline: string;
  scrollHint: string;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLSpanElement>(null);
  const horizontalRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const [interactive, setInteractive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, -48]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.55]);
  const contentScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.985]);

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 48rem) and (prefers-reduced-motion: no-preference)'
    );
    const sync = () => {
      setInteractive(query.matches);
      if (!query.matches) {
        if (crosshairRef.current) crosshairRef.current.style.opacity = '0';
        heroRef.current?.style.setProperty('--hero-tx', '0px');
        heroRef.current?.style.setProperty('--hero-ty', '0px');
      }
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const resetPointer = () => {
    if (crosshairRef.current) crosshairRef.current.style.opacity = '0';
    heroRef.current?.style.setProperty('--hero-tx', '0px');
    heroRef.current?.style.setProperty('--hero-ty', '0px');
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!interactive || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

    if (verticalRef.current) verticalRef.current.style.transform = `translateX(${x}px)`;
    if (horizontalRef.current) horizontalRef.current.style.transform = `translateY(${y}px)`;
    if (cursorRef.current) {
      cursorRef.current.style.left = `${x}px`;
      cursorRef.current.style.top = `${y}px`;
    }
    if (coordRef.current) {
      coordRef.current.style.left = `${Math.min(x + 14, rect.width - 106)}px`;
      coordRef.current.style.top = `${Math.min(y + 16, rect.height - 20)}px`;
      coordRef.current.textContent = `X ${String(Math.round(x)).padStart(
        4,
        '0'
      )} / Y ${String(Math.round(y)).padStart(4, '0')}`;
    }
    if (crosshairRef.current) crosshairRef.current.style.opacity = '1';

    const nx = (x / Math.max(1, rect.width)) * 2 - 1;
    const ny = (y / Math.max(1, rect.height)) * 2 - 1;
    heroRef.current.style.setProperty('--hero-tx', `${(nx * 4).toFixed(2)}px`);
    heroRef.current.style.setProperty('--hero-ty', `${(ny * 3).toFixed(2)}px`);
  };

  const tokens = splitIdentity(siteName);

  return (
    <section
      ref={heroRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col items-center justify-center px-4 pt-16 pb-32 text-center"
    >
      <m.div
        style={
          interactive
            ? { y: contentY, opacity: contentOpacity, scale: contentScale }
            : undefined
        }
        className="relative z-10 flex w-full flex-col items-center justify-center py-12"
      >
        {/* --- drafting frame ------------------------------------------------ */}
        <div
          aria-hidden
          className="hero-frame pointer-events-none absolute inset-x-3 top-0 bottom-0 hidden sm:block"
        >
          <span
            className="hero-frame-x absolute top-0 right-0 left-0 h-px bg-ink/15 dark:bg-chalk/15"
            style={{ animationDelay: '80ms' }}
          />
          <span
            className="hero-frame-x absolute right-0 bottom-0 left-0 h-px bg-ink/15 dark:bg-chalk/15"
            style={{ animationDelay: '160ms' }}
          />
          <span
            className="hero-frame-y absolute top-0 bottom-0 left-0 w-px bg-ink/15 dark:bg-chalk/15"
            style={{ animationDelay: '120ms' }}
          />
          <span
            className="hero-frame-y absolute top-0 right-0 bottom-0 w-px bg-ink/15 dark:bg-chalk/15"
            style={{ animationDelay: '200ms' }}
          />

          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map(
            (position) => (
              <span
                key={position}
                className={`absolute ${position} -m-1 font-mono text-sm leading-none text-ink/20 dark:text-chalk/20`}
              >
                +
              </span>
            )
          )}

          <span
            className="hero-fade absolute -top-4 left-2 font-mono text-[0.55rem] tracking-[0.2em] text-ink/35 uppercase dark:text-slate-500"
            style={{ '--hero-delay': '220ms' } as CSSProperties}
          >
            00 / 00
          </span>
          <span
            className="hero-fade absolute -top-4 right-2 font-mono text-[0.55rem] tracking-[0.2em] text-ink/35 uppercase dark:text-slate-500"
            style={{ '--hero-delay': '300ms' } as CSSProperties}
          >
            SCALE 1:1
          </span>
          <span
            className="hero-fade absolute -bottom-4 left-2 font-mono text-[0.55rem] tracking-[0.2em] text-ink/35 uppercase dark:text-slate-500"
            style={{ '--hero-delay': '380ms' } as CSSProperties}
          >
            SG / 01.35°N
          </span>
          <span
            className="hero-fade absolute -bottom-4 right-2 font-mono text-[0.55rem] tracking-[0.2em] text-ink/35 uppercase dark:text-slate-500"
            style={{ '--hero-delay': '460ms' } as CSSProperties}
          >
            BLUEPRINT / HERO
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <p
            className="hero-fade mb-7 flex items-center justify-center gap-3 font-mono text-[0.62rem] tracking-[0.24em] text-ink/45 uppercase dark:text-slate-400"
            style={{ '--hero-delay': '160ms' } as CSSProperties}
          >
            <span aria-hidden className="h-px w-8 bg-ink/20 dark:bg-chalk/20" />
            Identity / Fig. 00
            <span aria-hidden className="h-px w-8 bg-ink/20 dark:bg-chalk/20" />
          </p>

          <div
            className="hero-title-wrap relative mx-auto w-full transition-transform duration-300 ease-out"
            style={{
              transform:
                'translate3d(var(--hero-tx, 0px), var(--hero-ty, 0px), 0)',
            }}
          >
            <div className="relative inline-block max-w-full">
              <h1 className="text-hero mx-auto max-w-[16ch] text-balance">
                {tokens.map((token, index) =>
                  token.space ? (
                    <span key={`space-${index}`}>{token.text}</span>
                  ) : (
                    <span
                      key={`word-${index}`}
                      className="hero-word"
                      style={
                        {
                          '--hero-delay': `${260 + index * 90}ms`,
                        } as CSSProperties
                      }
                    >
                      {token.text}
                    </span>
                  )
                )}
              </h1>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <span className="hero-scan-line absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-iris/60 to-transparent" />
              </span>
            </div>
          </div>

          <p
            className="hero-fade mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed font-medium text-ink/75 sm:text-xl dark:text-slate-300"
            style={{ '--hero-delay': '720ms' } as CSSProperties}
          >
            {tagline}
          </p>

          <div aria-hidden className="mt-10 flex items-center justify-center gap-2">
            <span
              className="animate-pop h-2.5 w-16 rounded-full bg-iris/70"
              style={{ animationDelay: '850ms' }}
            />
            <span
              className="animate-pop h-2.5 w-9 rounded-full bg-blush/70"
              style={{ animationDelay: '930ms' }}
            />
            <span
              className="animate-pop h-2.5 w-24 rounded-full bg-sun/80"
              style={{ animationDelay: '1010ms' }}
            />
            <span
              className="animate-pop h-3.5 w-3.5 rotate-12 rounded-[4px] bg-mint/70"
              style={{ animationDelay: '1090ms' }}
            />
          </div>
        </div>
      </m.div>

      <div
        className="hero-fade absolute bottom-8 left-0 right-0 flex justify-center"
        style={{ '--hero-delay': '1120ms' } as CSSProperties}
      >
        <a
          href="#about"
          className="group flex flex-col items-center gap-3 rounded-2xl px-4 py-2 text-ink/55 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"
        >
          <span className="text-[0.7rem] font-bold tracking-[0.22em] uppercase">
            {scrollHint}
          </span>
          <span className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1">
            <span className="h-2 w-1 animate-bob rounded-full bg-current max-md:animate-none" />
          </span>
        </a>
      </div>

      {/* Pointer crosshair: behind the title, above the frame. It only exists
          visually on a desktop with motion enabled. */}
      <div
        ref={crosshairRef}
        aria-hidden
        className="hero-crosshair pointer-events-none absolute inset-0 z-[5] hidden opacity-0 transition-opacity duration-300 md:block"
      >
        <span
          ref={verticalRef}
          className="absolute top-0 bottom-0 left-0 w-px bg-ink/15 dark:bg-chalk/15"
        />
        <span
          ref={horizontalRef}
          className="absolute top-0 right-0 left-0 h-px bg-ink/15 dark:bg-chalk/15"
        />
        <span
          ref={cursorRef}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-sm text-iris/60 dark:text-indigo-300/70"
        >
          +
        </span>
        <span
          ref={coordRef}
          className="absolute font-mono text-[0.55rem] tracking-[0.18em] text-ink/40 tabular-nums dark:text-slate-500"
        >
          X 0000 / Y 0000
        </span>
      </div>
    </section>
  );
}
