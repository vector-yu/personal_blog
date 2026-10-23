import type { Metadata } from 'next';
import { ProjectCard } from '@/components/projects/project-card';
import { SectionLink } from '@/components/site/section-link';
import { getProjects } from '@/lib/projects';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '项目',
  description: '做过的项目、实验和长期维护的东西。',
};

export default async function ProjectsPage() {
  const { intro, items } = await getProjects();
  const ordered = [...items].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.year.localeCompare(a.year)
  );

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Work
        </p>
        <h1 className="mt-3 text-headline">项目</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/65 dark:text-slate-300">{intro}</p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">文章</SectionLink>
          <SectionLink href="/notes">笔记</SectionLink>
          <SectionLink href="/start-here">从这开始</SectionLink>
        </nav>
      </header>

      {ordered.length > 0 ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {ordered.map((project) => (
            <li key={`${project.title}-${project.year}`} className="h-full">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有项目。进入 /admin 的「项目」里添加第一个吧。
        </p>
      )}
    </main>
  );
}
