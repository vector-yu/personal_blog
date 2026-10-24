import type { HomeTech } from '@/lib/home';
import { TechChip } from './tech-chip';

function TechGroup({
  techStack,
  duplicate = false,
}: {
  techStack: HomeTech[];
  duplicate?: boolean;
}) {
  return (
    <ul
      aria-hidden={duplicate || undefined}
      className={`flex shrink-0 items-center gap-2 pr-2 ${
        duplicate ? 'max-md:hidden motion-reduce:hidden' : ''
      }`}
    >
      {techStack.map((tech, index) => (
        <li key={`${tech.name}-${tech.icon}-${index}`}>
          <TechChip tech={tech} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The homepage's tech-stack marquee, between the profile and the résumé.
 *
 * The track duplicates the chips and animates by -50%, giving a seamless loop.
 * The second copy is hidden below `md` and under reduced motion; there the strip
 * becomes a normal horizontal scroll area (user-driven, not autoplay), so the
 * standing "no mobile motion" rule still holds. Hovering pauses the desktop loop
 * so a chip can actually be read.
 */
export function TechMarquee({
  techStack,
  ariaLabel,
}: {
  techStack: HomeTech[];
  ariaLabel: string;
}) {
  if (techStack.length === 0) return null;

  return (
    <section
      aria-label={ariaLabel}
      className="relative z-10 mt-16 overflow-hidden border-y-2 border-ink/10 bg-white/35 py-4 backdrop-blur-xl backdrop-saturate-125 dark:border-chalk/10 dark:bg-white/[0.025]"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-2 text-[0.62rem] font-black tracking-[0.2em] text-ink/40 uppercase dark:text-slate-500">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mint" />
          Toolbox
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)] max-md:overflow-x-auto motion-reduce:overflow-x-auto">
          <div className="flex w-max animate-[tech-marquee_38s_linear_infinite] hover:[animation-play-state:paused] max-md:animate-none motion-reduce:animate-none">
            <TechGroup techStack={techStack} />
            <TechGroup techStack={techStack} duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}
