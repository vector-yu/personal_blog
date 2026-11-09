/**
 * Unit tests for locale routing and date formatting.
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/unit-i18n.mjs
 */
import {
  localePath,
  stripLocale,
  switchLocalePath,
  isLocale,
} from '../src/i18n/config.ts';
import { formatMessage } from '../src/i18n/format.ts';
import {
  formatDate,
  formatMonthDay,
  formatNumericMonthDay,
  formatWeekday,
  toPostSummaries,
} from '../src/lib/site.ts';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

check('isLocale accepts zh/en', isLocale('zh') && isLocale('en'));
check('isLocale rejects other values', !isLocale('fr') && !isLocale('zh-CN') && !isLocale(undefined));

check('localePath zh root', localePath('zh', '/') === '/zh');
check('localePath en root', localePath('en', '/') === '/en');
check('localePath zh posts', localePath('zh', '/posts') === '/zh/posts');
check('localePath en posts', localePath('en', '/posts') === '/en/posts');
check(
  'localePath does not double-prefix',
  localePath('en', '/en/posts') === '/en/posts' && localePath('zh', '/zh/posts') === '/zh/posts'
);

check('stripLocale zh', stripLocale('/zh/posts/hello') === '/posts/hello');
check('stripLocale en', stripLocale('/en/posts/hello') === '/posts/hello');
check('stripLocale keeps an unprefixed path', stripLocale('/posts') === '/posts');

check('switch zh -> en', switchLocalePath('/zh/posts/hello', 'en') === '/en/posts/hello');
check('switch en -> zh', switchLocalePath('/en/about', 'zh') === '/zh/about');
check('switch tag detail goes to index', switchLocalePath('/zh/tags/Next.js', 'en') === '/en/tags');
check('switch series detail goes to index', switchLocalePath('/en/series/x', 'zh') === '/zh/series');
check('switch paged list goes to root', switchLocalePath('/en/posts/page/2', 'zh') === '/zh/posts');

check(
  'formatMessage replaces placeholders',
  formatMessage('{count} posts / {name}', { count: 3, name: 'Vector' }) === '3 posts / Vector'
);
check(
  'formatMessage leaves unknown placeholders',
  formatMessage('{missing}', {}) === '{missing}'
);

const date = '2026-01-15T00:00:00.000Z';
check('formatDate zh', formatDate(date, 'zh') === '2026年1月15日', formatDate(date, 'zh'));
check('formatDate en', formatDate(date, 'en') === 'January 15, 2026', formatDate(date, 'en'));
check('formatDate invalid', formatDate('not-a-date', 'en') === '');
check('formatMonthDay zh', formatMonthDay(date, 'zh') === '1月15日', formatMonthDay(date, 'zh'));
check('formatMonthDay en', formatMonthDay(date, 'en') === 'Jan 15', formatMonthDay(date, 'en'));
check('formatNumericMonthDay', formatNumericMonthDay(date) === '1/15', formatNumericMonthDay(date));
check('formatWeekday zh', formatWeekday(date, 'zh') === '周四', formatWeekday(date, 'zh'));
check('formatWeekday en', formatWeekday(date, 'en') === 'Thu', formatWeekday(date, 'en'));

/*
 * `toPostSummaries` also reads the optional ProblemMeta card out of the MDX body.
 * The 每日一题 series page relies on those two fields for its weekly overview, and the
 * body is the only place they live — there are no dedicated frontmatter fields.
 */
const dailyEdges = [
  {
    node: {
      title: '20. Valid Parentheses',
      date: '2026-10-01T00:00:00.000Z',
      description: null,
      tags: ['栈'],
      series: '每日一题',
      featured: false,
      draft: false,
      body: {
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'ProblemMeta',
            props: { review: '基本功', difficulty: 'Eazy' },
          },
        ],
      },
      _sys: { filename: 'daily-20.mdx', relativePath: 'daily-20.mdx' },
    },
  },
  {
    node: {
      title: 'Ordinary post',
      date: '2026-10-02T00:00:00.000Z',
      description: null,
      tags: null,
      series: null,
      featured: false,
      draft: false,
      body: { type: 'root', children: [{ type: 'p', children: [] }] },
      _sys: { filename: 'ordinary.mdx', relativePath: 'ordinary.mdx' },
    },
  },
];
const summaries = toPostSummaries(dailyEdges);
const daily = summaries.find((item) => item.title === '20. Valid Parentheses');
const ordinary = summaries.find((item) => item.title === 'Ordinary post');
check(
  'PostSummary reads review and normalizes Eazy',
  daily?.review === '基本功' && daily?.difficulty === 'Easy',
  `${daily?.review} / ${daily?.difficulty}`
);
check(
  'PostSummary leaves ordinary posts without problem metadata',
  ordinary?.review === null && ordinary?.difficulty === null,
  `${ordinary?.review} / ${ordinary?.difficulty}`
);

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
