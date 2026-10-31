import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SectionLink } from '@/components/site/section-link';
import { localePath } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import { buildMetadata } from '@/i18n/metadata';
import { getLocale, messagesFor } from '@/i18n/server';
import { getHomeContent } from '@/lib/home';
import { getReading, type Book, type ReadingStatus } from '@/lib/reading';

export const revalidate = 60;

const STATUS_ORDER: ReadingStatus[] = ['reading', 'finished', 'wishlist'];

const STATUS_TONE: Record<ReadingStatus, string> = {
  reading:
    'border-iris/40 bg-iris/15 text-iris-text dark:border-iris/35 dark:bg-iris/20 dark:text-indigo-200',
  finished:
    'border-mint/45 bg-mint/20 text-emerald-800 dark:border-mint/35 dark:bg-mint/15 dark:text-emerald-200',
  wishlist:
    'border-sun/55 bg-sun/25 text-amber-800 dark:border-sun/35 dark:bg-sun/15 dark:text-amber-200',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return buildMetadata({
    locale,
    path: '/reading',
    title: messages.reading.metaTitle,
    description: messages.reading.metaDescription,
  });
}

function Rating({ value, label }: { value: number; label: string }) {
  if (value <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-sun" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden className={index < value ? 'opacity-100' : 'opacity-20'}>
          ★
        </span>
      ))}
    </span>
  );
}

function BookCard({ book, labels }: { book: Book; labels: ReturnType<typeof messagesFor>['reading'] }) {
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
            {labels.statusReading && book.status === 'reading'
              ? labels.statusReading
              : book.status === 'finished'
                ? labels.statusFinished
                : labels.statusWishlist}
          </span>
        </div>

        {book.rating > 0 ? (
          <div className="mt-2">
            <Rating
              value={book.rating}
              label={formatMessage(labels.rating, { value: book.rating })}
            />
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
            {labels.viewBook}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default async function ReadingPage() {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  const labels = messages.reading;
  // Site-level switch: while the page is being rebuilt it can be hidden from the
  // footer and returns a 404 here, so no half-finished list is published.
  const { showReading } = await getHomeContent(locale);
  if (!showReading) notFound();

  const { intro, books } = await getReading(locale);
  const groups = STATUS_ORDER.map((status) => ({
    status,
    label:
      status === 'reading'
        ? labels.statusReading
        : status === 'finished'
          ? labels.statusFinished
          : labels.statusWishlist,
    books: books.filter((book) => book.status === status),
  })).filter((group) => group.books.length > 0);

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-14 sm:py-16">
      <header className="animate-rise">
        <p className="text-[0.68rem] font-black tracking-[0.24em] text-ink/45 uppercase dark:text-slate-500">
          {labels.eyebrow}
        </p>
        <h1 className="mt-3 text-headline">{labels.title}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/65 dark:text-slate-300">{intro}</p>
        <nav aria-label={messages.common.contentNav} className="mt-6 flex flex-wrap gap-2">
          <SectionLink href={localePath(locale, '/notes')}>{labels.navNotes}</SectionLink>
          <SectionLink href={localePath(locale, '/projects')}>{labels.navProjects}</SectionLink>
          <SectionLink href={localePath(locale, '/about')}>{labels.navAbout}</SectionLink>
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
                  {formatMessage(labels.count, { count: group.books.length })}
                </span>
              </div>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.books.map((book) => (
                  <li key={`${book.title}-${book.author}`}>
                    <BookCard book={book} labels={labels} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40 p-6 text-center text-sm font-medium text-ink/60 dark:border-chalk/20 dark:bg-white/[0.03] dark:text-slate-400">
          {labels.empty}
        </p>
      )}
    </main>
  );
}
