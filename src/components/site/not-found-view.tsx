import Link from 'next/link';
import { LostPlane } from '@/components/site/illustrations';
import { localePath, type Locale } from '@/i18n/config';
import type { Messages } from '@/i18n/messages';

/** Shared 404 body; the locale wrapper and the global fallback both use it. */
export function NotFoundView({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div className="animate-rise">
        <LostPlane className="h-40 w-auto sm:h-52" />

        <h1 className="mt-10 text-headline">{messages.notFound.title}</h1>

        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/75 dark:text-slate-300">
          {messages.notFound.description}
        </p>

        <span
          aria-hidden
          className="mt-8 block h-2 w-32 origin-left animate-rule rounded-full bg-gradient-to-r from-iris via-blush to-sun"
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={localePath(locale, '/')}
            className="rounded-full border-[3px] border-ink/85 bg-sun/80 px-5 py-2.5 font-bold text-ink shadow-brutal-iris backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-blush motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.08] dark:text-slate-100 dark:shadow-chalk dark:hover:shadow-chalk-lg"
          >
            {messages.notFound.home}
          </Link>
          <Link
            href={localePath(locale, '/posts')}
            className="rounded-full border-[3px] border-ink/25 bg-white/50 px-5 py-2.5 font-bold text-ink/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/85 hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-chalk/40 dark:hover:shadow-chalk-sm"
          >
            {messages.notFound.posts}
          </Link>
        </div>
      </div>
    </main>
  );
}
