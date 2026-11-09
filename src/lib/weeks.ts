/**
 * Week grouping for date-ordered series (currently the 每日一题 / Daily Problem log).
 *
 * The site stores every post date as UTC midnight (`2026-09-21T00:00:00.000Z`), so all
 * arithmetic here is deliberately UTC. Using local time would put a Sunday post into the
 * next week for visitors east of UTC and into the previous one for visitors west of it —
 * a static page cannot depend on the reader's timezone.
 *
 * Weeks start on Monday and are labelled with their **ISO week number and week-year**,
 * e.g. “2026 年第 39 周” / “Week 39 of 2026”. The ISO week-year is used because a week
 * can straddle New Year: 2026-12-28 belongs to week 53 of 2026, not week 1 of 2027.
 *
 * Kept dependency-free (no `@/` imports) so `scripts/unit-weeks.mjs` can import it with
 * Node's type stripping, outside the Next bundler.
 */

const DAY_MS = 86_400_000;

/**
 * The series that reads as a weekly log: one dated LeetCode problem per day.
 * Other series may span months with a handful of posts, so grouping them by calendar
 * week would produce a wall of one-item weeks.
 *
 * Chinese and English use different series names because the series name is displayed
 * verbatim (and becomes the URL segment); both map to the same weekly view.
 */
export const WEEKLY_SERIES = '每日一题';
export const WEEKLY_SERIES_EN = 'Daily Problem';

export function isWeeklySeries(series: string | null | undefined): boolean {
  return series === WEEKLY_SERIES || series === WEEKLY_SERIES_EN;
}

export type WeekGroup<T extends { date: string }> = {
  /** ISO date (YYYY-MM-DD) of the Monday that opens the week. */
  start: string;
  /** ISO date (YYYY-MM-DD) of the Sunday that closes the week. */
  end: string;
  /** ISO week-year; may differ from the calendar year at New Year. */
  weekYear: number;
  /** ISO week number within `weekYear` (1–53). */
  week: number;
  /** Posts in this week, newest first. */
  posts: T[];
  /** Distinct calendar days that actually have a post (gaps are allowed). */
  days: number;
};

/** Stable key/id for a week, e.g. `2026-W39`. */
export function weekKey(week: { weekYear: number; week: number }): string {
  return `${week.weekYear}-W${String(week.week).padStart(2, '0')}`;
}

/** UTC midnight of the given date, or null when the value is not a valid date. */
function utcDay(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Monday 00:00 UTC of the week that contains `day`. */
function mondayOf(day: Date): Date {
  const offset = (day.getUTCDay() + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0
  return new Date(day.getTime() - offset * DAY_MS);
}

/** `YYYY-MM-DD` for a UTC date. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * ISO week-year and week number for a Monday.
 *
 * The ISO week that contains a given date is determined by that week's Thursday, so
 * using Thursday avoids the New Year ambiguity. `ceil(dayOfYear / 7)` is then the week
 * number within that Thursday's year.
 */
function isoWeekOf(monday: Date): { weekYear: number; week: number } {
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  const weekYear = thursday.getUTCFullYear();
  const dayOfYear = Math.floor(
    (thursday.getTime() - Date.UTC(weekYear, 0, 1)) / DAY_MS
  ) + 1;
  return { weekYear, week: Math.ceil(dayOfYear / 7) };
}

/**
 * Group dated posts into Monday–Sunday weeks, newest week first.
 *
 * Posts without a valid date are skipped. Input order is preserved for the caller
 * (the array is copied before sorting), and posts inside a week are sorted newest first
 * so the newest problems appear first everywhere.
 */
export function groupPostsByWeek<T extends { date: string }>(posts: readonly T[]): WeekGroup<T>[] {
  const groups = new Map<string, { start: Date; posts: T[] }>();

  for (const post of posts) {
    const day = utcDay(post.date);
    if (!day) continue;

    const start = mondayOf(day);
    const key = isoDay(start);
    const group = groups.get(key);

    if (group) {
      group.posts.push(post);
    } else {
      groups.set(key, { start, posts: [post] });
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => {
      const ordered = [...group.posts].sort(
        (a, b) => (utcDay(b.date)?.getTime() ?? 0) - (utcDay(a.date)?.getTime() ?? 0)
      );
      const days = new Set(
        ordered.map((post) => {
          const day = utcDay(post.date);
          return day ? isoDay(day) : '';
        })
      ).size;
      const { weekYear, week } = isoWeekOf(group.start);

      return {
        start: key,
        end: isoDay(new Date(group.start.getTime() + 6 * DAY_MS)),
        weekYear,
        week,
        posts: ordered,
        days,
      };
    });
}
