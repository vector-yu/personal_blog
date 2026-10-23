import { HomeHero } from '@/components/home/hero';
import { HeroBackground } from '@/components/home/hero-background';
import { ProfileSection } from '@/components/home/profile-section';
import { TimelineSection } from '@/components/home/timeline-section';
import { TechMarquee } from '@/components/tech/tech-marquee';
import { getHomeContent } from '@/lib/home';

export const revalidate = 60;

/**
 * The personal homepage.
 *
 * Three deliberate moves, compared with the previous "hero + latest posts"
 * layout:
 *
 *  1. The first screen belongs to the SITE NAME and the motto only.
 *  2. The background is still the shared flowing-geometry `<Backdrop />` by
 *     default; `HeroBackground` lets the owner switch it to a still/video later
 *     without touching this file (see the `background` field in the schema).
 *  3. The content below is a biography followed by the résumé, not a post list.
 *     Articles live at /posts and in the header.
 *
 * This file is a Server Component: it reads the single `content/home/home.json`
 * document and hands normalised, flat props to the presentational components.
 * The zipper is the only client component, and it receives no Tina metadata.
 */
export default async function HomePage() {
  const home = await getHomeContent();

  return (
    <main className="relative isolate z-10">
      <HeroBackground background={home.background} />

      <HomeHero
        siteName={home.siteName}
        tagline={home.tagline}
        scrollHint={home.scrollHint}
      />

      <ProfileSection profile={home.profile} />

      <TechMarquee techStack={home.techStack} />

      <TimelineSection entries={home.timeline} />
    </main>
  );
}
