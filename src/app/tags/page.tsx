import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLink } from '@/components/site/section-link';
import { tagTone } from '@/components/posts/tag-tones';
import { getPosts } from '@/lib/posts';
import { collectTags, tagPath } from '@/lib/taxonomy';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '标签',
  description: '按标签浏览全部文章。',
};

export default async function TagsPage() {
  const posts = await getPosts();
  const tags = collectTags(posts);
  const names = tags.map((tag) => tag.name);

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Taxonomy
        </p>
        <h1 className="mt-3 text-headline">标签</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/65 dark:text-slate-300">
          {tags.length > 0
            ? `${tags.length} 个标签，${posts.length} 篇文章。点开一个标签，看同一主题下的全部内容。`
            : '还没有标签。给文章加上标签后，这里会自动生成聚合页。'}
        </p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/posts">全部文章</SectionLink>
          <SectionLink href="/archive">归档</SectionLink>
        </nav>
      </header>

      {tags.length > 0 ? (
        <ul className="mt-10 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <li key={tag.name}>
              <Link
                href={tagPath(tag.name)}
                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold shadow-brutal-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-chalk-xs ${tagTone(tag.name, names)}`}
              >
                {tag.name}
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[0.65rem] font-black tabular-nums dark:bg-white/10">
                  {tag.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有标签。进入 /admin 编辑一篇文章，在「标签」里添加即可。
        </p>
      )}
    </main>
  );
}
