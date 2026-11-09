/**
 * Unit tests for the Monday-based week grouping used by the 每日一题 series page.
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/unit-weeks.mjs
 */
import { groupPostsByWeek, isWeeklySeries, weekAnchor } from '../src/lib/weeks.ts';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const post = (date, title) => ({ date, title });

const input = [
  post('2026-10-01T00:00:00.000Z', 'Thu'),
  post('2026-09-27T00:00:00.000Z', 'Sun'),
  post('2026-09-28T00:00:00.000Z', 'Mon next'),
  post('2026-09-21T00:00:00.000Z', 'Mon'),
];
const originalOrder = input.map((item) => item.title);

const weeks = groupPostsByWeek(input);

check('groups Sunday with the preceding Monday', weeks.length === 2, `weeks=${weeks.length}`);
check('week 1 starts on Monday 2026-09-21', weeks[0]?.start === '2026-09-21', weeks[0]?.start);
check('week 1 ends on Sunday 2026-09-27', weeks[0]?.end === '2026-09-27', weeks[0]?.end);
check('week 1 is index 1', weeks[0]?.index === 1, String(weeks[0]?.index));
check(
  'week 1 posts are oldest first',
  weeks[0]?.posts.map((item) => item.title).join(',') === 'Mon,Sun',
  weeks[0]?.posts.map((item) => item.title).join(',')
);
check('week 1 counts two distinct days', weeks[0]?.days === 2, String(weeks[0]?.days));

check('week 2 starts on Monday 2026-09-28', weeks[1]?.start === '2026-09-28', weeks[1]?.start);
check('week 2 ends on Sunday 2026-10-04', weeks[1]?.end === '2026-10-04', weeks[1]?.end);
check(
  'week 2 posts are oldest first',
  weeks[1]?.posts.map((item) => item.title).join(',') === 'Mon next,Thu',
  weeks[1]?.posts.map((item) => item.title).join(',')
);

check(
  'does not mutate the caller’s array',
  input.map((item) => item.title).join(',') === originalOrder.join(','),
  input.map((item) => item.title).join(',')
);

const yearBoundary = groupPostsByWeek([
  post('2027-01-01T00:00:00.000Z', 'New year'),
  post('2026-12-31T00:00:00.000Z', 'Old year'),
]);
check(
  'Friday and Thursday across New Year share the 2026-12-28 week',
  yearBoundary.length === 1 &&
    yearBoundary[0].start === '2026-12-28' &&
    yearBoundary[0].end === '2027-01-03' &&
    yearBoundary[0].posts.map((item) => item.title).join(',') === 'Old year,New year',
  yearBoundary.map((week) => `${week.start}..${week.end}`).join(' / ')
);

const missing = groupPostsByWeek([
  post('not-a-date', 'Broken'),
  post('', 'Empty'),
  post('2026-09-21T00:00:00.000Z', 'Valid'),
]);
check('skips invalid and empty dates', missing.length === 1 && missing[0].posts.length === 1,
  `weeks=${missing.length}, posts=${missing[0]?.posts.length}`);

const offset = groupPostsByWeek([post('2026-09-21T23:00:00-05:00', 'Late local')]);
check(
  'normalizes offset timestamps to their UTC day',
  offset.length === 1 && offset[0].start === '2026-09-21' && offset[0].days === 1,
  `${offset[0]?.start} / ${offset[0]?.days}`
);

const duplicated = groupPostsByWeek([
  post('2026-09-21T00:00:00.000Z', 'First'),
  post('2026-09-21T00:00:00.000Z', 'Second'),
]);
check(
  'two posts on the same day count as one day',
  duplicated[0]?.posts.length === 2 && duplicated[0]?.days === 1,
  `posts=${duplicated[0]?.posts.length}, days=${duplicated[0]?.days}`
);

check('week anchors are stable', weekAnchor(1) === 'week-1' && weekAnchor(7) === 'week-7');
check(
  'weekly series names are recognized in both languages',
  isWeeklySeries('每日一题') && isWeeklySeries('Daily Problem') && !isWeeklySeries('Other')
);

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
