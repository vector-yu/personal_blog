import type { Metadata } from 'next';
import { ResumeEntryRow } from '@/components/home/resume-entry';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getHomeContent } from '@/lib/home';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/resume',
    title: messages.resume.metaTitle,
    description: messages.resume.metaDescription,
  });
}

export default async function ResumePage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const { timeline } = await getHomeContent(locale);

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <h1 className="text-headline">{messages.resume.title}</h1>

      {timeline.length === 0 ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          {messages.resume.empty}
        </p>
      ) : (
        <ol className="mt-10 divide-y-2 divide-dashed divide-ink/15 dark:divide-chalk/15">
          {timeline.map((entry, index) => (
            <ResumeEntryRow
              key={`${entry.period}-${entry.title}`}
              entry={entry}
              index={index}
              presentLabel={messages.resume.present}
            />
          ))}
        </ol>
      )}
    </main>
  );
}
