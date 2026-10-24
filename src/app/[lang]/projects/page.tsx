import type { Metadata } from 'next';
import { ProjectCard } from '@/components/projects/project-card';
import { SectionLink } from '@/components/site/section-link';
import { localePath } from '@/i18n/config';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getProjects } from '@/lib/projects';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/projects',
    title: messages.projects.metaTitle,
    description: messages.projects.metaDescription,
  });
}

export default async function ProjectsPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const { intro, items } = await getProjects(locale);
  const ordered = [...items].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.year.localeCompare(a.year)
  );

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {messages.projects.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{messages.projects.title}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/65 dark:text-slate-300">{intro}</p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/posts')}>{messages.projects.navPosts}</SectionLink>
          <SectionLink href={localePath(locale, '/notes')}>{messages.projects.navNotes}</SectionLink>
          <SectionLink href={localePath(locale, '/start-here')}>
            {messages.projects.navStart}
          </SectionLink>
        </nav>
      </header>

      {ordered.length > 0 ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {ordered.map((project) => (
            <li key={`${project.title}-${project.year}`} className="h-full">
              <ProjectCard project={project} labels={messages.projects} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          {messages.projects.empty}
        </p>
      )}
    </main>
  );
}
