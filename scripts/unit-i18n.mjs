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
import { formatDate } from '../src/lib/site.ts';

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

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
