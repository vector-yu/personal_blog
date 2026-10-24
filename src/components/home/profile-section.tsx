import Image from 'next/image';
import { formatMessage } from '@/i18n/format';
import { isUrlAllowedForOptimizer } from '@/lib/image-hosts';
import type { HomeProfile } from '@/lib/home';

/**
 * The biography, opened up across the page.
 *
 * There is deliberately no "关于我" heading: the name itself is the heading. On
 * a wide viewport the portrait sits in the left column and the facts run as a
 * four-column row underneath the bio, so the section uses the page instead of
 * stacking a narrow card.
 *
 * The portrait and each fact keep `.scroll-reveal`; the class is inert on
 * phones and under reduced motion (see globals.css), where everything is simply
 * present.
 */
export function ProfileSection({
  profile,
  avatarAlt,
}: {
  profile: HomeProfile;
  avatarAlt: string;
}) {
  return (
    <section
      id="about"
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-6 pt-20 sm:pt-28"
    >
      <div className="grid gap-10 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:items-start sm:gap-14 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
        {/* --- portrait ---------------------------------------------------- */}
        <div className="scroll-reveal mx-auto w-56 sm:mx-0 sm:w-full">
          <div className="relative -rotate-2 rounded-[2.5rem] border-[3px] border-ink bg-white/60 p-2.5 shadow-brutal-xl backdrop-blur-xl backdrop-saturate-125 dark:border-chalk/25 dark:bg-white/[0.05] dark:shadow-chalk-lg">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-ink/80 bg-gradient-to-br from-iris/30 via-blush/30 to-sun/30 dark:border-chalk/20">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                alt={formatMessage(avatarAlt, { name: profile.name })}
              />
            </div>

            <span
              aria-hidden
              className="absolute -right-3 -bottom-3 rotate-3 rounded-full border-2 border-ink bg-mint px-3 py-1 text-[0.65rem] font-black tracking-[0.18em] text-ink shadow-brutal-xs dark:border-chalk"
            >
              HELLO
            </span>
          </div>
        </div>

        {/* --- name, school, bio, facts ----------------------------------- */}
        <div className="scroll-reveal">
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-black tracking-tight text-balance">
            {profile.name}
          </h2>

          {profile.school ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-ink/20 bg-white/70 px-3.5 py-1.5 text-sm font-bold text-ink/75 backdrop-blur dark:border-chalk/20 dark:bg-white/[0.06] dark:text-slate-200">
              <span aria-hidden className="h-2 w-2 rounded-full bg-iris" />
              {profile.school}
            </p>
          ) : null}

          {profile.bio ? (
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink/75 dark:text-slate-300">
              {profile.bio}
            </p>
          ) : null}

          {profile.facts.length > 0 ? (
            <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 border-t-2 border-dashed border-ink/20 pt-7 sm:grid-cols-2 xl:grid-cols-4 dark:border-chalk/20">
              {profile.facts.map((fact) => (
                <div key={fact.label} className="scroll-reveal min-w-0">
                  <dt className="text-[0.68rem] font-black tracking-[0.18em] text-ink/45 uppercase dark:text-slate-400">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 text-base font-semibold break-words text-ink/85 dark:text-slate-200">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Avatar({ src, name, alt }: { src: string | null; name: string; alt: string }) {
  if (!src) {
    return (
      <span className="grid h-full w-full place-items-center bg-gradient-to-br from-iris via-blush to-sun text-5xl font-black text-white">
        {name.slice(0, 1)}
      </span>
    );
  }

  const remote = /^https?:\/\//.test(src);
  let optimizerAllowed = false;
  if (remote) {
    try {
      optimizerAllowed = isUrlAllowedForOptimizer(new URL(src));
    } catch {
      optimizerAllowed = false;
    }
  }

  if (remote && optimizerAllowed) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 14rem, 22rem"
        className="object-cover"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}
