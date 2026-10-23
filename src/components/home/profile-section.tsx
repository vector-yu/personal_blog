import Image from 'next/image';
import { isUrlAllowedForOptimizer } from '@/lib/image-hosts';
import type { HomeProfile } from '@/lib/home';
import { SectionHeading } from '@/components/home/section-heading';

/**
 * "About me": a portrait sticker on the left, then the facts as a ruled list.
 *
 * The facts are real list rows rather than a paragraph because the homepage is
 * meant to be scanned, not read: name, school, major, city. Each row carries
 * `.scroll-reveal`, so on a pointer device they arrive one after another as the
 * section enters the viewport; on phones the class is inert (the global mobile
 * rule disables all animation) and every row is simply present.
 */
export function ProfileSection({ profile }: { profile: HomeProfile }) {
  return (
    <section
      id="about"
      className="relative mx-auto w-full max-w-4xl scroll-mt-24 px-4 pt-24 sm:pt-28"
    >
      <SectionHeading
        index="01"
        title="关于我"
        description="一些基本事实，以及我最近在忙什么。往下还有一条可以拉开的履历。"
      />

      <div className="mt-11 grid gap-10 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-start sm:gap-12">
        {/* --- portrait ---------------------------------------------------- */}
        <div className="scroll-reveal mx-auto w-52 sm:mx-0 sm:w-full">
          <div className="relative -rotate-2 rounded-[2.5rem] border-[3px] border-ink bg-white/60 p-2.5 shadow-brutal-xl backdrop-blur-xl backdrop-saturate-125 dark:border-chalk/25 dark:bg-white/[0.05] dark:shadow-chalk-lg">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-ink/80 bg-gradient-to-br from-iris/30 via-blush/30 to-sun/30 dark:border-chalk/20">
              <Avatar src={profile.avatar} name={profile.name} />
            </div>

            <span
              aria-hidden
              className="absolute -right-3 -bottom-3 rotate-3 rounded-full border-2 border-ink bg-mint px-3 py-1 text-[0.65rem] font-black tracking-[0.18em] text-ink shadow-brutal-xs dark:border-chalk"
            >
              HELLO
            </span>
          </div>
        </div>

        {/* --- facts ------------------------------------------------------- */}
        <div className="scroll-reveal">
          <h3 className="text-title">{profile.name}</h3>

          {profile.school ? (
            <p className="mt-2.5 inline-flex items-center gap-2 rounded-full border-2 border-ink/20 bg-white/70 px-3.5 py-1 text-sm font-bold text-ink/75 backdrop-blur dark:border-chalk/20 dark:bg-white/[0.06] dark:text-slate-200">
              <span aria-hidden className="h-2 w-2 rounded-full bg-iris" />
              {profile.school}
            </p>
          ) : null}

          {profile.bio ? (
            <p className="mt-5 leading-relaxed text-ink/75 dark:text-slate-300">{profile.bio}</p>
          ) : null}

          {profile.facts.length > 0 ? (
            <dl className="mt-8 border-y-2 border-dashed border-ink/20 dark:border-chalk/20">
              {profile.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="scroll-reveal grid grid-cols-[5rem_1fr] items-baseline gap-4 border-b border-dashed border-ink/15 py-3.5 last:border-b-0 sm:grid-cols-[6.5rem_1fr] dark:border-chalk/15"
                >
                  <dt className="text-[0.68rem] font-black tracking-[0.18em] text-ink/45 uppercase dark:text-slate-400">
                    {fact.label}
                  </dt>
                  <dd className="text-sm font-semibold text-ink/85 sm:text-base dark:text-slate-200">
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

function Avatar({ src, name }: { src: string | null; name: string }) {
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
        alt={`${name} 的头像`}
        fill
        sizes="(max-width: 640px) 13rem, 15rem"
        className="object-cover"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} 的头像`}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}
