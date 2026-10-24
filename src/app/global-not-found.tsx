import type { Metadata } from 'next';
import Link from 'next/link';
import { LostPlane } from '@/components/site/illustrations';
import { messagesFor } from '@/i18n/server';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: false },
};

/**
 * Last-resort 404 for URLs that match no route at all.
 *
 * With the root layout inside `[lang]`, there is no locale to read here, so the
 * page is deliberately bilingual and offers both home links. Route-level
 * `notFound()` calls are handled by `[lang]/not-found.tsx` and stay localized.
 */
export default function GlobalNotFound() {
  const zh = messagesFor('zh');
  const en = messagesFor('en');

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="isolate flex min-h-screen flex-col overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-16">
          <LostPlane className="h-36 w-auto sm:h-48" />
          <h1 className="mt-8 text-headline">{zh.notFound.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/75 dark:text-slate-300">
            {zh.notFound.description}
          </p>
          <p lang="en" className="mt-4 text-base leading-relaxed text-ink/60 dark:text-slate-400">
            {en.notFound.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/zh"
              className="rounded-full border-[3px] border-ink/85 bg-sun/80 px-5 py-2.5 font-bold text-ink shadow-brutal-iris backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-blush motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.08] dark:text-slate-100 dark:shadow-chalk"
            >
              中文 · {zh.notFound.home}
            </Link>
            <Link
              href="/en"
              className="rounded-full border-[3px] border-ink/85 bg-white/60 px-5 py-2.5 font-bold text-ink shadow-brutal backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:hover:translate-y-0 dark:border-chalk/25 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-chalk"
            >
              English · {en.notFound.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
