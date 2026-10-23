import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Body from '@/components/tina-markdown';
import { SocialLinks } from '@/components/site/social-links';
import { client } from '@/lib/tina';
import { getHomeContent } from '@/lib/home';

export const revalidate = 60;

const ABOUT_PATH = 'about.mdx';

async function loadAbout() {
  // The client uses errorPolicy: 'include' (see src/lib/tina.ts), so a missing page resolves
  // to null and the caller can notFound() instead of the request rejecting.
  const { data } = await client.queries.page({ relativePath: ABOUT_PATH });
  return data?.page ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [page, home] = await Promise.all([loadAbout(), getHomeContent()]);
    return {
      title: page?.title ?? '关于',
      description: home.profile.bio || home.tagline,
    };
  } catch {
    return { title: '关于' };
  }
}

export default async function AboutPage() {
  // The page collection allows renaming/deleting files, so this document may legitimately
  // not exist. Render a 404 instead of crashing with an unhandled error, and let genuine
  // query failures surface rather than being masked as "not found".
  let page: Awaited<ReturnType<typeof loadAbout>>;
  let home: Awaited<ReturnType<typeof getHomeContent>>;

  try {
    [page, home] = await Promise.all([loadAbout(), getHomeContent()]);
  } catch (error) {
    console.error('Failed to load the about page:', error);
    throw error;
  }

  if (!page) notFound();

  const { profile, socials } = home;

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          About
        </p>

        <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-headline text-balance">{profile.name}</h1>
            {profile.school ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-ink/20 bg-white/70 px-3.5 py-1.5 text-sm font-bold text-ink/75 backdrop-blur dark:border-chalk/20 dark:bg-white/[0.06] dark:text-slate-200">
                <span aria-hidden className="h-2 w-2 rounded-full bg-iris" />
                {profile.school}
              </p>
            ) : null}
          </div>

          <div className="relative h-28 w-28 shrink-0 -rotate-2 rounded-[2rem] border-[3px] border-ink bg-white/60 p-1.5 shadow-brutal-lg backdrop-blur-xl dark:border-chalk/25 dark:bg-white/[0.05] dark:shadow-chalk-lg">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border-2 border-ink/80 bg-gradient-to-br from-iris/30 via-blush/30 to-sun/30 dark:border-chalk/20">
              <Image
                src={profile.avatar ?? '/uploads/avatar.svg'}
                alt={profile.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75 dark:text-slate-300">
            {profile.bio}
          </p>
        ) : null}

        {profile.facts.length > 0 ? (
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t-2 border-dashed border-ink/20 pt-6 sm:grid-cols-4 dark:border-chalk/20">
            {profile.facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`}>
                <dt className="text-[0.65rem] font-black tracking-[0.16em] text-ink/45 uppercase dark:text-slate-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm leading-snug font-bold text-ink/80 dark:text-slate-200">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <SocialLinks socials={socials} className="mt-7" />
      </header>

      <div className="prose prose-slate mt-12 max-w-none animate-rise dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:border-b-0 prose-strong:font-black prose-li:marker:text-iris [animation-delay:100ms]">
        <Body content={page.body} />
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-ink/20 pt-6 text-sm dark:border-chalk/20">
        <p className="font-medium text-ink/60 dark:text-slate-400">
          这个站持续更新。想第一时间看到新文章，可以订阅 RSS。
        </p>
        <a
          href="/rss.xml"
          className="inline-flex items-center gap-2 rounded-full border-2 border-ink/85 bg-white/70 px-4 py-2 font-bold text-ink/75 shadow-brutal-xs backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun hover:text-ink hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-chalk-xs dark:hover:bg-white/15 dark:hover:text-white"
        >
          RSS 订阅
        </a>
      </div>
    </main>
  );
}
