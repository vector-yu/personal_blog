import Image from 'next/image';
import { TiltCard } from '@/components/site/tilt-card';
import type { ProjectItem } from '@/lib/projects';

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function ProjectLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(isExternal(href) ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 bg-white/60 px-3 py-1.5 text-xs font-bold text-ink/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/60 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/20 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-chalk/50 dark:hover:text-white"
    >
      {children}
    </a>
  );
}

export function ProjectCard({ project }: { project: ProjectItem }) {
  return (
    <TiltCard
      lift={4}
      maxTilt={3}
      className="group flex h-full flex-col overflow-hidden rounded-blob border-[3px] border-ink/85 bg-white/60 shadow-brutal backdrop-blur-xl backdrop-saturate-125 transition-shadow duration-300 hover:shadow-brutal-iris motion-reduce:transition-none dark:border-chalk/20 dark:bg-white/[0.04] dark:shadow-chalk dark:hover:shadow-chalk-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-ink/10 bg-gradient-to-br from-iris/25 via-blush/20 to-sun/25 dark:border-chalk/10">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div aria-hidden className="grid h-full w-full place-items-center">
            <span className="text-5xl font-black text-ink/25 dark:text-chalk/25">
              {[...project.title][0] ?? '·'}
            </span>
          </div>
        )}

        {project.featured ? (
          <span className="absolute top-3 left-3 rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-[0.62rem] font-black tracking-[0.14em] text-ink shadow-brutal-xs dark:border-chalk">
            精选
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-title">{project.title}</h2>
          {project.year ? (
            <span className="mt-1 shrink-0 text-xs font-black text-ink/40 tabular-nums dark:text-slate-500">
              {project.year}
            </span>
          ) : null}
        </div>

        {project.role ? (
          <p className="mt-1 text-xs font-bold tracking-wide text-ink/45 dark:text-slate-500">
            {project.role}
          </p>
        ) : null}

        {project.summary ? (
          <p className="mt-3 leading-relaxed text-ink/70 dark:text-slate-300">{project.summary}</p>
        ) : null}

        {project.stack.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="技术栈">
            {project.stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-ink/15 bg-white/50 px-2 py-0.5 text-[0.65rem] font-bold text-ink/55 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-400"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {project.link || project.repo ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {project.link ? <ProjectLink href={project.link}>在线访问 ↗</ProjectLink> : null}
            {project.repo ? <ProjectLink href={project.repo}>代码 ↗</ProjectLink> : null}
          </div>
        ) : null}
      </div>
    </TiltCard>
  );
}
