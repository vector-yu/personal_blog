import Link from 'next/link';
import { tagTone } from '@/components/posts/tag-tones';
import { localePath, type Locale } from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import {
  formatMonthDay,
  formatNumericMonthDay,
  formatWeekday,
  postSlug,
  type PostSummary,
  type ProblemDifficulty,
} from '@/lib/site';
import { collectTags, postTags, tagPath } from '@/lib/taxonomy';
import { weekAnchor, type WeekGroup } from '@/lib/weeks';

type WeeklyLabels = Messages['seriesDetail']['weekly'];

/** Decorative accent per week, cycling through the site's four accent colours. */
const WEEK_DOTS = ['bg-iris', 'bg-blush', 'bg-sun', 'bg-mint'] as const;

/** Compact difficulty chips reuse the semantic colours of the ProblemMeta card. */
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

function weekRange(week: WeekGroup<PostSummary>, locale: Locale) {
  return `${formatMonthDay(week.start, locale)} – ${formatMonthDay(week.end, locale)}`;
}

/** One-line range for the narrow seven-column index. */
function compactWeekRange(week: WeekGroup<PostSummary>) {
  return `${formatNumericMonthDay(week.start)}–${formatNumericMonthDay(week.end)}`;
}

function padWeek(index: number) {
  return String(index).padStart(2, '0');
}

function countDifficulties(posts: PostSummary[]): Record<ProblemDifficulty, number> {
  const counts: Record<ProblemDifficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const post of posts) {
    if (post.difficulty) counts[post.difficulty] += 1;
  }
  return counts;
}

/**
 * Weekly view of a date-ordered series.
 *
 * This replaces the flat card list for 每日一题: each week is a chapter with its own
 * date range, difficulty mix, topics and the week's problems in reading order. Every
 * article keeps its own URL, so the weekly view is a layer over the archive, not a
 * replacement for the posts.
 */
export function WeeklySeries({
  weeks,
  locale,
  tags,
  labels,
}: {
  weeks: WeekGroup<PostSummary>[];
  locale: Locale;
  tags: string[];
  labels: WeeklyLabels;
}) {
  const total = weeks.reduce((sum, week) => sum + week.posts.length, 0);

  return (
    <>
      <nav aria-label={labels.indexTitle} className="mt-12 animate-rise">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[0.68rem] font-black tracking-[0.24em] text-ink/60 uppercase dark:text-slate-300">
            {labels.indexTitle}
          </h2>
          <p className="font-mono text-[0.68rem] font-bold text-ink/60 tabular-nums dark:text-slate-300">
            {formatMessage(labels.indexMeta, { weeks: weeks.length, posts: total })}
          </p>
        </div>

        <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weeks.map((week) => (
            <li key={week.start} className="min-w-0">
              <a
                href={`#${weekAnchor(week.index)}`}
                className="flex h-full flex-col rounded-xl border-2 border-ink/15 bg-white/55 p-3 shadow-brutal-xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-brutal-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.04] dark:shadow-chalk-xs dark:hover:border-chalk/35 dark:hover:shadow-chalk-sm"
              >
                <span className="flex items-center gap-1.5 font-mono text-[0.62rem] font-black tracking-[0.16em] text-ink/60 dark:text-slate-300">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rotate-45 rounded-[1px] ${WEEK_DOTS[(week.index - 1) % WEEK_DOTS.length]}`}
                  />
                  {formatMessage(labels.weekCode, { week: padWeek(week.index) })}
                </span>
                <span className="mt-1.5 text-sm font-black">
                  {formatMessage(labels.week, { week: week.index })}
                </span>
                <span className="mt-0.5 text-[0.65rem] font-bold leading-relaxed text-ink/60 tabular-nums whitespace-nowrap dark:text-slate-300">
                  {compactWeekRange(week)}
                </span>
                <span className="mt-auto pt-2 font-mono text-[0.65rem] font-bold text-ink/60 tabular-nums dark:text-slate-300">
                  {formatMessage(labels.problems, { count: week.posts.length })}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-16">
        {weeks.map((week) => {
          const counts = countDifficulties(week.posts);
          const weekTags = collectTags(week.posts, locale);
          const totalDifficulty = counts.Easy + counts.Medium + counts.Hard;

          return (
            <section
              key={week.start}
              id={weekAnchor(week.index)}
              aria-labelledby={`${weekAnchor(week.index)}-title`}
              className="scroll-mt-24"
            >
              <header>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`h-2 w-2 rotate-45 rounded-[2px] ${WEEK_DOTS[(week.index - 1) % WEEK_DOTS.length]}`}
                  />
                  <span className="font-mono text-[0.65rem] font-black tracking-[0.2em] text-ink/60 uppercase tabular-nums dark:text-slate-300">
                    {formatMessage(labels.weekCode, { week: padWeek(week.index) })}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-gradient-to-r from-ink/20 via-ink/10 to-transparent dark:from-chalk/25 dark:via-chalk/10"
                  />
                  <time
                    dateTime={week.start}
                    className="font-mono text-[0.68rem] font-bold text-ink/60 tabular-nums dark:text-slate-300"
                  >
                    {weekRange(week, locale)}
                  </time>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                  <div className="flex items-end gap-4">
                    <span
                      aria-hidden
                      className="font-mono text-5xl leading-none font-black tracking-tighter text-ink/[0.09] tabular-nums sm:text-6xl dark:text-chalk/[0.1]"
                    >
                      {padWeek(week.index)}
                    </span>
                    <div>
                      <h2 id={`${weekAnchor(week.index)}-title`} className="text-3xl font-black">
                        {formatMessage(labels.week, { week: week.index })}
                      </h2>
                      <p className="mt-1 text-sm font-bold text-ink/60 dark:text-slate-300">
                        {formatMessage(labels.weekMeta, {
                          count: week.posts.length,
                          days: week.days,
                        })}
                      </p>
                    </div>
                  </div>

                  {totalDifficulty > 0 ? (
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="flex flex-wrap gap-1.5">
                        {DIFFICULTY_LEVELS.map((level) =>
                          counts[level] > 0 ? (
                            <span
                              key={level}
                              className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[0.62rem] font-black ${DIFFICULTY_TONES[level]}`}
                            >
                              <span
                                aria-hidden
                                className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_BARS[level]}`}
                              />
                              {level} {counts[level]}
                            </span>
                          ) : null
                        )}
                      </div>
                      <div
                        aria-hidden
                        className="flex h-1.5 w-36 overflow-hidden rounded-full border border-ink/10 bg-ink/5 dark:border-chalk/15 dark:bg-white/10"
                      >
                        {DIFFICULTY_LEVELS.map((level) =>
                          counts[level] > 0 ? (
                            <span
                              key={level}
                              className={`block h-full ${DIFFICULTY_BARS[level]}`}
                              style={{ width: `${(counts[level] / totalDifficulty) * 100}%` }}
                            />
                          ) : null
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {weekTags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-mono text-[0.62rem] font-black tracking-[0.18em] text-ink/60 uppercase dark:text-slate-300">
                      {labels.topics}
                    </span>
                    {weekTags.map((tag) => (
                      <Link
                        key={tag.name}
                        href={localePath(locale, tagPath(tag.name))}
                        className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[0.65rem] font-bold ${tagTone(tag.name, tags)}`}
                      >
                        {tag.name}
                        <span className="font-mono text-[0.6rem] opacity-65 tabular-nums">
                          {tag.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </header>

              <ol className="mt-6 border-t-2 border-dashed border-ink/15 dark:border-chalk/15">
                {week.posts.map((post) => {
                  const postTagList = postTags(post);

                  return (
                    <li
                      key={post.relativePath}
                      className="border-b-2 border-dashed border-ink/15 dark:border-chalk/15"
                    >
                      <article className="grid gap-2 py-4 sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:gap-4">
                        <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                          <time
                            dateTime={post.date}
                            className="font-mono text-xs font-black text-ink/60 tabular-nums dark:text-slate-300"
                          >
                            {formatMonthDay(post.date, locale)}
                          </time>
                          <span className="text-[0.68rem] font-bold text-ink/60 dark:text-slate-300">
                            {formatWeekday(post.date, locale)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="min-w-0">
                            <h3 className="text-base leading-snug font-black sm:text-lg">
                              <Link
                                href={localePath(locale, `/posts/${postSlug(post)}`)}
                                className="decoration-iris decoration-2 underline-offset-4 hover:underline"
                              >
                                {post.title}
                              </Link>
                            </h3>
                            {post.review ? (
                              <p className="mt-1 text-sm leading-relaxed text-ink/70 dark:text-slate-300">
                                {formatMessage(labels.reviewQuote, { review: post.review })}
                              </p>
                            ) : null}
                            {postTagList.length > 0 ? (
                              <p className="mt-1.5 text-[0.68rem] leading-relaxed font-bold text-ink/60 dark:text-slate-300">
                                {postTagList.map((tag, index) => (
                                  <span key={tag}>
                                    {index > 0 ? <span aria-hidden> · </span> : null}
                                    <Link
                                      href={localePath(locale, tagPath(tag))}
                                      className="hover:text-iris-text dark:hover:text-indigo-200"
                                    >
                                      {tag}
                                    </Link>
                                  </span>
                                ))}
                              </p>
                            ) : null}
                          </div>

                          {post.difficulty ? (
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full border-2 px-2 py-0.5 text-[0.62rem] font-black tracking-wide ${DIFFICULTY_TONES[post.difficulty]}`}
                            >
                              {post.difficulty}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
