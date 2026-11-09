import { tagTone } from '@/components/posts/tag-tones';
import { WeekExplorer, type WeekView } from '@/components/posts/week-explorer';
import { localePath, type Locale } from '@/i18n/config';
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
import { weekKey, type WeekGroup } from '@/lib/weeks';

type WeeklyLabels = Messages['seriesDetail']['weekly'];

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
 * The public URL keeps the complete archive, but the UI behaves like a week picker:
 * the newest ISO week is selected by default and only that week's problems are shown.
 * All weeks are flattened into client-safe view models here (no relativePath, no Tina
 * client) so the client bundle passes `check:runtime`.
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
  const views: WeekView[] = weeks.map((week) => ({
    key: weekKey(week),
    weekYear: week.weekYear,
    week: week.week,
    start: week.start,
    end: week.end,
    rangeLabel: `${formatMonthDay(week.start, locale)} – ${formatMonthDay(week.end, locale)}`,
    compactRangeLabel: `${formatNumericMonthDay(week.start)}–${formatNumericMonthDay(week.end)}`,
    postCount: week.posts.length,
    days: week.days,
    difficulties: countDifficulties(week.posts),
    topics: collectTags(week.posts, locale).map((tag) => ({
      name: tag.name,
      count: tag.count,
      href: localePath(locale, tagPath(tag.name)),
      tone: tagTone(tag.name, tags),
    })),
    problems: week.posts.map((post) => ({
      href: localePath(locale, `/posts/${postSlug(post)}`),
      title: post.title,
      dateIso: post.date,
      dateLabel: formatMonthDay(post.date, locale),
      weekdayLabel: formatWeekday(post.date, locale),
      review: post.review,
      difficulty: post.difficulty,
      tags: postTags(post).map((tag) => ({
        name: tag,
        href: localePath(locale, tagPath(tag)),
      })),
    })),
  }));

  return <WeekExplorer weeks={views} labels={labels} />;
}
