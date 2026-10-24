import type { Metadata } from 'next';
import { HomeHero } from '@/components/home/hero';
import { HeroBackground } from '@/components/home/hero-background';
import { ProfileSection } from '@/components/home/profile-section';
import { TimelineSection } from '@/components/home/timeline-section';
import { TechMarquee } from '@/components/tech/tech-marquee';
import { localePath } from '@/i18n/config';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getHomeContent } from '@/lib/home';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const home = await getHomeContent(locale);
  return buildMetadata({
    locale,
    path: '/',
    title: home.siteName,
    description: home.tagline || messages.common.siteDescription,
    siteName: home.siteName,
  });
}

/**
 * The personal homepage for one locale.
 *
 * The route tree already carries `[lang]`; `getLocale()` reads it on the server
 * so the page does not have to thread `params` through every presentational
 * component. All data is read from the locale's own document.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const home = await getHomeContent(locale);

  return (
    <main className="relative isolate z-10">
      <HeroBackground background={home.background} />

      <HomeHero
        siteName={home.siteName}
        tagline={home.tagline}
        scrollHint={home.scrollHint}
      />

      <ProfileSection profile={home.profile} avatarAlt={messages.home.avatarAlt} />

      <TechMarquee techStack={home.techStack} ariaLabel={messages.home.techStackAria} />

      <TimelineSection
        entries={home.timeline}
        readArticlesHref={localePath(locale, '/posts')}
        readArticlesLabel={messages.home.readArticles}
        emptyText={messages.home.emptyTimeline}
        presentLabel={messages.home.present}
      />
    </main>
  );
}
