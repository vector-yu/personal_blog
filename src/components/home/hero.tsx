/**
 * The first screen: site name, motto, and a quiet cue to keep scrolling.
 *
 * Deliberately almost empty. The old homepage stacked a hero, a gradient strip
 * and the latest posts into the first viewport; here the only job of the first
 * screen is to establish the name and let the background breathe.
 *
 * The title uses `text-hero` (a CJK-aware clamp defined in globals.css) rather
 * than Tailwind's Latin display sizes, which collapse at Chinese glyph widths.
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
  return (
    <section className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col items-center justify-center px-4 pt-16 pb-32 text-center">
      <div className="animate-rise">
        <span
          aria-hidden
          className="mx-auto mb-8 block h-2 w-24 origin-center animate-rule rounded-full bg-gradient-to-r from-iris via-blush to-sun"
        />

        <h1 className="text-hero mx-auto max-w-[16ch] text-balance">{siteName}</h1>

        <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed font-medium text-ink/75 sm:text-xl dark:text-slate-300">
          {tagline}
        </p>

        {/* The shape family, borrowed from the backdrop as a signature strip. */}
        <div aria-hidden className="mt-10 flex items-center justify-center gap-2">
          <span className="h-2.5 w-16 rounded-full bg-iris/70" />
          <span className="h-2.5 w-9 rounded-full bg-blush/70" />
          <span className="h-2.5 w-24 rounded-full bg-sun/80" />
          <span className="h-3.5 w-3.5 rotate-12 rounded-[4px] bg-mint/70" />
        </div>
      </div>

      <a
        href="#about"
        className="group absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 rounded-2xl px-4 py-2 text-ink/55 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"
      >
        <span className="text-[0.7rem] font-bold tracking-[0.22em] uppercase">
          {scrollHint}
        </span>
        <span className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1">
          <span className="h-2 w-1 animate-bob rounded-full bg-current max-md:animate-none" />
        </span>
      </a>
    </section>
  );
}
