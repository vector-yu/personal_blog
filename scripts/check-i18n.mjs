/**
 * Offline bilingual-content gate.
 *
 * Checks the things that TypeScript cannot:
 *  - the Chinese and English dictionaries have exactly the same keys;
 *  - every required English document exists;
 *  - every Chinese post/page has an English counterpart with the same slug
 *    (the language switch relies on that pairing).
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/check-i18n.mjs [--strict]
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '../src/i18n/messages/en.ts';
import { zh } from '../src/i18n/messages/zh.ts';

const strict = process.argv.includes('--strict');
const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

function leafKeys(value, prefix = '') {
  if (typeof value === 'string') return [prefix];
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

function missingKeys(source, target) {
  const sourceKeys = new Set(leafKeys(source));
  const targetKeys = new Set(leafKeys(target));
  return [...sourceKeys].filter((key) => !targetKeys.has(key));
}

function filesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name);
}

/**
 * These series are intentionally Chinese-only. Their posts still appear under
 * /zh and are excluded from /en; the language switch lands on the English list
 * when a translation is missing. Everything outside this allowlist still has
 * to be paired.
 */
const CHINESE_ONLY_SERIES = new Set(['每日一题']);

function seriesOf(file) {
  const source = readFileSync(join('content/posts', file), 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!frontmatter) return null;
  const line = /^series:\s*(.+)$/m.exec(frontmatter[1]);
  if (!line) return null;
  return line[1].trim().replace(/^["']|["']$/g, '');
}

function isChineseOnly(file) {
  return CHINESE_ONLY_SERIES.has(seriesOf(file));
}

function jsonIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);
}

try {
  // 1. Dictionary parity
  const missingInEn = missingKeys(zh, en);
  const missingInZh = missingKeys(en, zh);
  check(
    'English dictionary has every Chinese key',
    missingInEn.length === 0,
    missingInEn.join(', ') || 'aligned'
  );
  check(
    'Chinese dictionary has every English key',
    missingInZh.length === 0,
    missingInZh.join(', ') || 'aligned'
  );

  const emptyValues = [...leafKeys(zh), ...leafKeys(en)].filter((key) => {
    const read = (object, path) => path.split('.').reduce((value, part) => value?.[part], object);
    return !String(read(zh, key) ?? '').trim() || !String(read(en, key) ?? '').trim();
  });
  check('no empty dictionary values', emptyValues.length === 0, emptyValues.join(', ') || 'none');

  // 2. Required English documents
  const required = [
    'content/home/home.en.json',
    'content/projects/projects.en.json',
    'content/notes/notes.en.json',
    'content/reading/reading.en.json',
    'content/pages-en/about.mdx',
    'content/pages-en/start-here.mdx',
  ];
  const missingDocs = required.filter((path) => !existsSync(path));
  check('required English documents exist', missingDocs.length === 0, missingDocs.join(', ') || 'all present');

  // 3. Post/page slug parity
  const zhPosts = filesIn('content/posts').sort();
  const enPosts = filesIn('content/posts-en').sort();
  const postsMissing = zhPosts.filter((file) => !enPosts.includes(file));
  const chineseOnlyPosts = postsMissing.filter(isChineseOnly);
  const postsMissingTranslations = postsMissing.filter((file) => !isChineseOnly(file));
  const postsExtra = enPosts.filter((file) => !zhPosts.includes(file));
  const postParity = postsMissingTranslations.length === 0 && postsExtra.length === 0;
  check(
    'every Chinese post has an English counterpart with the same slug',
    strict ? postParity : postsMissingTranslations.length === 0,
    [
      postsMissingTranslations.length
        ? `missing: ${postsMissingTranslations.join(', ')}`
        : '',
      postsExtra.length ? `extra: ${postsExtra.join(', ')}` : '',
      chineseOnlyPosts.length
        ? `Chinese-only series: ${chineseOnlyPosts.length} post(s) (${[...CHINESE_ONLY_SERIES].join(', ')})`
        : '',
    ]
      .filter(Boolean)
      .join('; ') || 'paired'
  );
  if (!strict && postsMissingTranslations.length > 0) {
    console.warn('  (translation coverage is reported as a warning without --strict)');
  }

  const zhPages = filesIn('content/pages').sort();
  const enPages = filesIn('content/pages-en').sort();
  const pagesMissing = zhPages.filter((file) => !enPages.includes(file));
  check(
    'every Chinese page has an English counterpart',
    pagesMissing.length === 0,
    pagesMissing.join(', ') || 'paired'
  );

  // 4. JSON document parity
  for (const dir of ['content/home', 'content/projects', 'content/notes', 'content/reading']) {
    const zhJson = jsonIn(dir).filter((file) => !file.includes('.en.'));
    const enJson = jsonIn(dir).filter((file) => file.includes('.en.'));
    check(
      `${dir} has matching .en.json documents`,
      zhJson.length === enJson.length,
      `${zhJson.length} zh / ${enJson.length} en`
    );
  }
} catch (error) {
  check('i18n check completed', false, error.message);
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
