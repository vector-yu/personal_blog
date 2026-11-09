/**
 * Week grouping for date-ordered series (currently the 每日一题 / Daily Problem log).
 *
 * The site stores every post date as UTC midnight (`2026-09-21T00:00:00.000Z`), so all
 * arithmetic here is deliberately UTC. Using local time would put a Sunday post into the
 * next week for visitors east of UTC and into the previous one for visitors west of it —
 * a static page cannot depend on the reader's timezone.
 *
 * Weeks start on Monday (ISO / Chinese calendar convention) and are numbered from 1 in
 * chronological order, not by ISO week number: this is a reading sequence, so the first
 * week of the series is "第 1 周" even though it happens to be ISO week 39.
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
  /** 1-based position within this series, in chronological order. */
  index: number;
  /** Posts in this week, oldest first. */
  posts: T[];
  /** Distinct calendar days that actually have a post (gaps are allowed). */
  days: number;
};

/** Stable anchor id for a week section. */
export function weekAnchor(index: number): string {
  return `week-${index}`;
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
 * Group dated posts into Monday–Sunday weeks, oldest week first.
 *
 * Posts without a valid date are skipped. Input order is preserved for the caller
 * (the array is copied before sorting), and posts inside a week are sorted oldest first
 * so a week reads like a diary even though `getPosts` returns newest first.
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
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group], position) => {
      const ordered = [...group.posts].sort(
        (a, b) => (utcDay(a.date)?.getTime() ?? 0) - (utcDay(b.date)?.getTime() ?? 0)
      );
      const days = new Set(
        ordered.map((post) => {
          const day = utcDay(post.date);
          return day ? isoDay(day) : '';
        })
      ).size;

      return {
        start: key,
        end: isoDay(new Date(group.start.getTime() + 6 * DAY_MS)),
        index: position + 1,
        posts: ordered,
        days,
      };
    });
}
