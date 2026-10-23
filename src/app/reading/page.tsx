import type { Metadata } from 'next';
import Image from 'next/image';
import { SectionLink } from '@/components/site/section-link';
import {
  getReading,
  READING_STATUS_LABELS,
  type Book,
  type ReadingStatus,
} from '@/lib/reading';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '阅读',
  description: '最近读过的书，以及在读和想读的清单。',
};

const STATUS_ORDER: ReadingStatus[] = ['reading', 'finished', 'wishlist'];

const STATUS_TONE: Record<ReadingStatus, string> = {
  reading:
    'border-iris/40 bg-iris/15 text-iris-text dark:border-iris/35 dark:bg-iris/20 dark:text-indigo-200',
  finished:
    'border-mint/45 bg-mint/20 text-emerald-800 dark:border-mint/35 dark:bg-mint/15 dark:text-emerald-200',
  wishlist:
    'border-sun/55 bg-sun/25 text-amber-800 dark:border-sun/35 dark:bg-sun/15 dark:text-amber-200',
};

function Rating({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs text-sun"
      aria-label={`评分 ${value} / 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden className={index < value ? 'opacity-100' : 'opacity-20'}>
          ★
        </span>
      ))}
    </span>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <article className="flex gap-4 rounded-blob border-2 border-ink/15 bg-white/55 p-4 shadow-brutal-sm backdrop-blur-xl sm:p-5 dark:border-chalk/15 dark:bg-white/[0.03] dark:shadow-chalk-sm">
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-ink/20 bg-gradient-to-br from-iris/25 via-blush/20 to-sun/25 dark:border-chalk/15">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div aria-hidden className="grid h-full w-full place-items-center">
            <span className="text-2xl font-black text-ink/25 dark:text-chalk/25">
              {[...book.title][0] ?? '·'}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h3 className="text-lg leading-snug font-black">{book.title}</h3>
            {book.author ? (
              <p className="mt-0.5 text-xs font-bold text-ink/45 dark:text-slate-500">
                {book.author}
              </p>
            ) : null}
          </div>
          <span
            className={`rounded-full border-2 px-2.5 py-0.5 text-[0.62rem] font-black ${STATUS_TONE[book.status]}`}
          >
            {READING_STATUS_LABELS[book.status]}
          </span>
        </div>

        {book.rating > 0 ? (
          <div className="mt-2">
            <Rating value={book.rating} />
          </div>
        ) : null}

        {book.note ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/65 dark:text-slate-300">
            {book.note}
          </p>
        ) : null}

        {book.link ? (
          <a
            href={book.link}
            {...(/^https?:\/\//i.test(book.link)
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
            className="mt-3 inline-flex text-xs font-bold text-iris-text underline decoration-2 underline-offset-4 hover:text-blush-text dark:text-indigo-300 dark:hover:text-rose-300"
          >
            查看这本书 ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default async function ReadingPage() {
  const { intro, books } = await getReading();
  const groups = STATUS_ORDER.map((status) => ({
    status,
    label: READING_STATUS_LABELS[status],
    books: books.filter((book) => book.status === status),
  })).filter((group) => group.books.length > 0);

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          Reading
        </p>
        <h1 className="mt-3 text-headline">阅读</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/65 dark:text-slate-300">{intro}</p>
        <nav aria-label="内容导航" className="mt-6 flex flex-wrap gap-2">
          <SectionLink href="/notes">笔记</SectionLink>
          <SectionLink href="/projects">项目</SectionLink>
          <SectionLink href="/about">关于</SectionLink>
        </nav>
      </header>

      {groups.length > 0 ? (
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section key={group.status} aria-labelledby={`reading-${group.status}`}>
              <div className="flex items-baseline gap-3">
                <h2 id={`reading-${group.status}`} className="text-xl font-black tracking-tight">
                  {group.label}
                </h2>
                <span className="text-xs font-bold text-ink/40 dark:text-slate-500">
                  {group.books.length} 本
                </span>
              </div>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.books.map((book) => (
                  <li key={`${book.title}-${book.author}`}>
                    <BookCard book={book} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          书单还是空的。进入 /admin 的「阅读」里添加第一本吧。
        </p>
      )}
    </main>
  );
}
