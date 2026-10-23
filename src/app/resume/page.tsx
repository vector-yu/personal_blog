import type { Metadata } from 'next';
import { ResumeEntryRow } from '@/components/home/resume-entry';
import { getHomeContent } from '@/lib/home';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '履历',
  description: '按时间排列的个人履历，与首页的拉链履历共用同一份内容。',
};

/**
 * The plain résumé page.
 *
 * Deliberately static and animation-free: this is the reference list linked
 * from the header, not the scroll-driven homepage section. It reads the SAME
 * `content/home/home.json` document as the homepage, so editing the timeline in
 * TinaCMS updates both.
 */
export default async function ResumePage() {
  const { timeline } = await getHomeContent();

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <h1 className="text-headline">履历</h1>

      {timeline.length === 0 ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          还没有履历条目。到 /admin 的「个人主页」里添加第一条吧。
        </p>
      ) : (
        <ol className="mt-10 divide-y-2 divide-dashed divide-ink/15 dark:divide-chalk/15">
          {timeline.map((entry, index) => (
            <ResumeEntryRow
              key={`${entry.period}-${entry.title}`}
              entry={entry}
              index={index}
            />
          ))}
        </ol>
      )}
    </main>
  );
}
