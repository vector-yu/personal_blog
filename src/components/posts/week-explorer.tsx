'use client';

import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { ProblemDifficulty } from '@/lib/site';

export type WeekProblemView = {
  href: string;
  title: string;
  dateIso: string;
  dateLabel: string;
  weekdayLabel: string;
  review: string | null;
  difficulty: ProblemDifficulty | null;
  tags: { name: string; href: string }[];
};

export type WeekTopicView = {
  name: string;
  href: string;
  count: number;
  tone: string;
};

export type WeekView = {
  key: string;
  weekYear: number;
  week: number;
  start: string;
  end: string;
  rangeLabel: string;
  /** One-line numeric range for the narrow week picker, e.g. 9/21–9/27. */
  compactRangeLabel: string;
  postCount: number;
  days: number;
  difficulties: Record<ProblemDifficulty, number>;
  topics: WeekTopicView[];
  problems: WeekProblemView[];
};

type Labels = Messages['seriesDetail']['weekly'];

const DIFFICULTY_TONES: Record<ProblemDifficulty, string> = {
  Easy: 'border-emerald-400/70 bg-emerald-50 text-emerald-900 dark:border-emerald-300/60 dark:bg-emerald-500/15 dark:text-emerald-100',
  Medium:
    'border-amber-400/70 bg-amber-50 text-amber-950 dark:border-amber-300/60 dark:bg-amber-500/15 dark:text-amber-100',
  Hard: 'border-rose-400/70 bg-rose-50 text-rose-950 dark:border-rose-300/60 dark:bg-rose-500/15 dark:text-rose-100',
};

const DIFFICULTY_BARS: Record<ProblemDifficulty, string> = {
  Easy: 'bg-emerald-400',
  Medium: 'bg-amber-400',
  Hard: 'bg-rose-400',
};

const DIFFICULTY_LEVELS: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard'];

const WEEK_DOTS = ['bg-iris', 'bg-blush', 'bg-sun', 'bg-mint'] as const;

function WeekPanel({ week, labels }: { week: WeekView; labels: Labels }) {
  const totalDifficulty =
    week.difficulties.Easy + week.difficulties.Medium + week.difficulties.Hard;

  return (
    <>
      <header>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`h-2 w-2 rotate-45 rounded-[2px] ${WEEK_DOTS[(week.week - 1) % WEEK_DOTS.length]}`}
          />
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-ink/20 via-ink/10 to-transparent dark:from-chalk/25 dark:via-chalk/10"
          />
          <time
            dateTime={week.start}
            className="font-mono text-[0.68rem] font-bold text-ink/60 tabular-nums dark:text-slate-300"
          >
            {week.rangeLabel}
          </time>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h2 id={`week-${week.key}-title`} className="text-2xl font-black sm:text-3xl">
              {formatMessage(labels.weekOfYear, {
                year: week.weekYear,
                week: week.week,
              })}
            </h2>
            <p className="mt-1 text-sm font-bold text-ink/60 dark:text-slate-300">
              {formatMessage(labels.weekMeta, {
                count: week.postCount,
                days: week.days,
              })}
            </p>
          </div>

          {totalDifficulty > 0 ? (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTY_LEVELS.map((level) =>
                  week.difficulties[level] > 0 ? (
                    <span
                      key={level}
                      className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[0.62rem] font-black ${DIFFICULTY_TONES[level]}`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_BARS[level]}`}
                      />
                      {level} {week.difficulties[level]}
                    </span>
                  ) : null
                )}
              </div>
              <div
                aria-hidden
                className="flex h-1.5 w-36 overflow-hidden rounded-full border border-ink/10 bg-ink/5 dark:border-chalk/15 dark:bg-white/10"
              >
                {DIFFICULTY_LEVELS.map((level) =>
                  week.difficulties[level] > 0 ? (
                    <span
                      key={level}
                      className={`block h-full ${DIFFICULTY_BARS[level]}`}
                      style={{ width: `${(week.difficulties[level] / totalDifficulty) * 100}%` }}
                    />
                  ) : null
                )}
              </div>
            </div>
          ) : null}
        </div>

        {week.topics.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[0.62rem] font-black tracking-[0.18em] text-ink/60 uppercase dark:text-slate-300">
              {labels.topics}
            </span>
            {week.topics.map((topic) => (
              <Link
                key={topic.name}
                href={topic.href}
                className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[0.65rem] font-bold ${topic.tone}`}
              >
                {topic.name}
                <span className="font-mono text-[0.6rem] opacity-65 tabular-nums">
                  {topic.count}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <ol className="mt-6 border-t-2 border-dashed border-ink/15 dark:border-chalk/15">
        {week.problems.map((problem) => (
          <li
            key={`${problem.href}-${problem.dateIso}`}
            className="border-b-2 border-dashed border-ink/15 dark:border-chalk/15"
          >
            <article className="grid gap-2 py-4 sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:gap-4">
              <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                <time
                  dateTime={problem.dateIso}
                  className="font-mono text-xs font-black text-ink/60 tabular-nums dark:text-slate-300"
                >
                  {problem.dateLabel}
                </time>
                <span className="text-[0.68rem] font-bold text-ink/60 dark:text-slate-300">
                  {problem.weekdayLabel}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="text-base leading-snug font-black sm:text-lg">
                    <Link
                      href={problem.href}
                      className="decoration-iris decoration-2 underline-offset-4 hover:underline"
                    >
                      {problem.title}
                    </Link>
                  </h3>
                  {problem.review ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink/70 dark:text-slate-300">
                      {formatMessage(labels.reviewQuote, { review: problem.review })}
                    </p>
                  ) : null}
                  {problem.tags.length > 0 ? (
                    <p className="mt-1.5 text-[0.68rem] leading-relaxed font-bold text-ink/60 dark:text-slate-300">
                      {problem.tags.map((tag, index) => (
                        <span key={tag.name}>
                          {index > 0 ? <span aria-hidden> · </span> : null}
                          <Link
                            href={tag.href}
                            className="hover:text-iris-text dark:hover:text-indigo-200"
                          >
                            {tag.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>

                {problem.difficulty ? (
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border-2 px-2 py-0.5 text-[0.62rem] font-black tracking-wide ${DIFFICULTY_TONES[problem.difficulty]}`}
                  >
                    {problem.difficulty}
                  </span>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * Week switcher for the Daily Problem series.
 *
 * Only the selected week is visible, but all week panels stay in the DOM (hidden) so the
 * static HTML still contains every article link. Without JavaScript the noscript style
 * reveals all panels, falling back to the old stacked archive instead of an empty page.
 */
export function WeekExplorer({ weeks, labels }: { weeks: WeekView[]; labels: Labels }) {
  const [selectedKey, setSelectedKey] = useState(() => weeks[0]?.key ?? '');
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const total = weeks.reduce((sum, week) => sum + week.postCount, 0);
  const activeKey = weeks.some((week) => week.key === selectedKey)
    ? selectedKey
    : (weeks[0]?.key ?? '');

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = weeks.length - 1;
    let next: number;

    if (event.key === 'ArrowRight') {
      next = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft') {
      next = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = last;
    } else {
      return;
    }

    event.preventDefault();
    setSelectedKey(weeks[next].key);
    tabs.current[next]?.focus();
  }

  return (
    <section aria-label={labels.indexTitle} className="mt-12 animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="week-selector-title"
          className="text-[0.68rem] font-black tracking-[0.24em] text-ink/60 uppercase dark:text-slate-300"
        >
          {labels.indexTitle}
        </h2>
        <p className="font-mono text-[0.68rem] font-bold text-ink/60 tabular-nums dark:text-slate-300">
          {formatMessage(labels.indexMeta, { weeks: weeks.length, posts: total })}
        </p>
      </div>

      <div
        role="tablist"
        aria-labelledby="week-selector-title"
        className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      >
        {weeks.map((week, index) => {
          const selected = week.key === activeKey;

          return (
            <button
              key={week.key}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${week.key}`}
              aria-selected={selected}
              aria-controls={`panel-${week.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setSelectedKey(week.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`flex min-h-[6.8rem] flex-col rounded-xl border-2 p-3 text-left transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-iris focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none dark:focus-visible:ring-offset-midnight ${
                selected
                  ? 'border-ink bg-ink text-paper shadow-brutal-sm dark:border-chalk dark:bg-white/15 dark:text-white dark:shadow-chalk-sm'
                  : 'border-ink/15 bg-white/55 text-ink shadow-brutal-xs hover:border-ink/40 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-100 dark:shadow-chalk-xs dark:hover:border-chalk/35'
              }`}
            >
              <span className="font-mono text-[0.62rem] font-black tracking-[0.16em] uppercase opacity-70">
                {formatMessage(labels.yearLabel, { year: week.weekYear })}
              </span>
              <span className="mt-1 text-sm font-black">
                {formatMessage(labels.weekNumber, { week: week.week })}
              </span>
              <span className="mt-0.5 text-[0.65rem] font-bold whitespace-nowrap opacity-70">
                {week.compactRangeLabel}
              </span>
              <span className="mt-auto pt-2 font-mono text-[0.65rem] font-bold opacity-70">
                {formatMessage(labels.problems, { count: week.postCount })}
              </span>
            </button>
          );
        })}
      </div>

      <noscript>
        <style>{'[data-week-panel]{display:block!important}'}</style>
        <p className="mt-4 max-w-xl text-sm leading-relaxed font-bold text-ink/60 dark:text-slate-300">
          {labels.noScript}
        </p>
      </noscript>

      <div className="mt-10">
        {weeks.map((week) => {
          const selected = week.key === activeKey;

          return (
            <section
              key={week.key}
              id={`panel-${week.key}`}
              role="tabpanel"
              aria-labelledby={`tab-${week.key}`}
              style={selected ? undefined : { display: 'none' }}
              data-week-panel
              tabIndex={0}
              className="scroll-mt-24 outline-none"
            >
              <WeekPanel week={week} labels={labels} />
            </section>
          );
        })}
      </div>
    </section>
  );
}
