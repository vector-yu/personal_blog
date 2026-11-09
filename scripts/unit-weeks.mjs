/**
 * Unit tests for the ISO week grouping used by the 每日一题 series page.
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/unit-weeks.mjs
 */
import { groupPostsByWeek, isWeeklySeries, weekKey } from '../src/lib/weeks.ts';

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
check('newest week comes first', weeks[0]?.start === '2026-09-28', weeks[0]?.start);
check('week starts on Monday 2026-09-28', weeks[0]?.start === '2026-09-28', weeks[0]?.start);
check('week ends on Sunday 2026-10-04', weeks[0]?.end === '2026-10-04', weeks[0]?.end);
check('newest week is ISO week 40 of 2026', weeks[0]?.week === 40, String(weeks[0]?.week));
check('newest week has the ISO week-year 2026', weeks[0]?.weekYear === 2026, String(weeks[0]?.weekYear));
check(
  'posts inside a week are newest first',
  weeks[0]?.posts.map((item) => item.title).join(',') === 'Thu,Mon next',
  weeks[0]?.posts.map((item) => item.title).join(',')
);
check('week counts two distinct days', weeks[0]?.days === 2, String(weeks[0]?.days));

check('older week starts on Monday 2026-09-21', weeks[1]?.start === '2026-09-21', weeks[1]?.start);
check('older week ends on Sunday 2026-09-27', weeks[1]?.end === '2026-09-27', weeks[1]?.end);
check('older week is ISO week 39 of 2026', weeks[1]?.week === 39, String(weeks[1]?.week));
check(
  'older week posts are newest first',
  weeks[1]?.posts.map((item) => item.title).join(',') === 'Sun,Mon',
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
    yearBoundary[0].weekYear === 2026 &&
    yearBoundary[0].week === 53 &&
    yearBoundary[0].posts.map((item) => item.title).join(',') === 'New year,Old year',
  yearBoundary.map((week) => `${week.start}..${week.end} (${week.weekYear}-W${week.week})`).join(' / ')
);

const newYearWeek = groupPostsByWeek([
  post('2027-01-04T00:00:00.000Z', 'Week one'),
]);
check(
  'the first Monday of 2027 is week 1 of 2027',
  newYearWeek[0]?.weekYear === 2027 && newYearWeek[0]?.week === 1,
  `${newYearWeek[0]?.weekYear}-W${newYearWeek[0]?.week}`
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

check('week keys are stable', weekKey(weeks[1]) === '2026-W39' && weekKey(weeks[0]) === '2026-W40');
check(
  'weekly series names are recognized in both languages',
  isWeeklySeries('每日一题') && isWeeklySeries('Daily Problem') && !isWeeklySeries('Other')
);

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
