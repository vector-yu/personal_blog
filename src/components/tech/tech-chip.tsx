import type { CSSProperties } from 'react';
import type { HomeTech } from '@/lib/home';
import { techEntry } from '@/lib/tech';

/**
 * A tech sticker: tinted icon tile + name.
 *
 * The icon is an SVG in `public/tech`, used as an alpha mask and painted with the
 * brand colour from `src/lib/tech.ts`. That keeps one monochrome file per brand
 * while still supporting light/dark colours. Unknown icons fall back to a
 * monogram, so an old CMS entry never breaks the row.
 */
export function TechChip({
  tech,
  variant = 'marquee',
}: {
  tech: HomeTech;
  variant?: 'marquee' | 'compact';
}) {
  const entry = techEntry(tech.icon);

  const iconStyle = entry
    ? ({
        maskImage: `url(/tech/${tech.icon}.svg)`,
        WebkitMaskImage: `url(/tech/${tech.icon}.svg)`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        '--tech-light': entry.light,
        '--tech-dark': entry.dark,
      } as CSSProperties)
    : undefined;

  const chipClass =
    variant === 'compact'
      ? 'flex h-full items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-white/55 p-2 text-[0.75rem] leading-tight font-bold text-ink/75 backdrop-blur dark:border-chalk/10 dark:bg-white/[0.04] dark:text-slate-300'
      : 'inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white/55 py-1.5 pr-3.5 pl-2 text-sm font-bold text-ink/70 backdrop-blur transition-colors hover:border-ink/30 hover:text-ink dark:border-chalk/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-chalk/25 dark:hover:text-white';

  const tileClass =
    variant === 'compact' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <span className={chipClass} title={tech.name}>
      <span
        className={`grid ${tileClass} shrink-0 place-items-center rounded-lg border-2 border-ink/10 bg-white/60 dark:border-chalk/10 dark:bg-white/[0.06]`}
      >
        {entry ? (
          <span
            aria-hidden
            className="h-4 w-4 bg-[var(--tech-light)] dark:bg-[var(--tech-dark)]"
            style={iconStyle}
          />
        ) : (
          <span
            aria-hidden
            className="text-[0.65rem] font-black text-ink/50 dark:text-slate-400"
          >
            {[...tech.name][0] ?? '·'}
          </span>
        )}
      </span>
      <span
        className={
          variant === 'compact' ? 'min-w-0 break-words' : 'whitespace-nowrap'
        }
      >
        {tech.name}
      </span>
    </span>
  );
}
