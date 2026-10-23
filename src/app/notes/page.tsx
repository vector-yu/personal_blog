import type { Metadata } from 'next';
import Body from '@/components/tina-markdown';
import { SectionLink } from '@/components/site/section-link';
import { getNotes } from '@/lib/notes';
import { formatDate } from '@/lib/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '笔记',
  description: '短一点的记录：最近在折腾什么、看到什么、想明白或没想明白的事。',
};

export default async function NotesPage() {
  const { intro, items } = await getNotes();

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Notes
        </p>
        <h1 className="mt-3 text-headline">笔记</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">{intro}</p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">文章</SectionLink>
          <SectionLink href="/projects">项目</SectionLink>
          <SectionLink href="/start-here">从这开始</SectionLink>
        </nav>
      </header>

      {items.length > 0 ? (
        <ol className="mt-10 space-y-6">
          {items.map((note) => (
            <li key={`${note.date}-${note.title}`}>
              <article className="rounded-blob border-2 border-ink/15 bg-white/55 p-5 shadow-brutal-sm backdrop-blur-xl sm:p-6 dark:border-chalk/15 dark:bg-white/[0.03] dark:shadow-chalk-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <time
                    dateTime={note.date}
                    className="text-xs font-black tracking-wide text-ink/45 tabular-nums dark:text-slate-500"
                  >
                    {formatDate(note.date)}
                  </time>
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-ink/15 bg-white/50 px-2 py-0.5 text-[0.65rem] font-bold text-ink/50 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {note.title ? <h2 className="mt-3 text-title">{note.title}</h2> : null}

                {note.body ? (
                  <div className="prose prose-slate mt-3 max-w-none text-[0.95rem] leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-li:marker:text-iris">
                    <Body content={note.body} />
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有笔记。进入 /admin 的「笔记 / 短记」里写一条吧。
        </p>
      )}
    </main>
  );
}
