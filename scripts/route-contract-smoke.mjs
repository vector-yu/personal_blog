/**
 * Offline contract test: every post URL the site *emits* must match a page the
 * site *generates*, in both locales.
 *
 * The site now prerenders `/zh/posts/...` and `/en/posts/...`; public URLs are
 * the same (Chinese is no longer unprefixed), so the only translation needed is
 * for legacy `/zh/...` references that might leak into markup.
 *
 * Runs against the build output only — no server, no API. Run
 * `npm run build:local` first.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = '.next/server/app';
const LOCALES = ['zh', 'en'];
const requireArtifacts = process.argv.includes('--require-artifacts');

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

function isPublishedPage(dir, baseName) {
  const meta = join(dir, `${baseName}.meta`);
  if (!existsSync(meta)) return true;
  try {
    const parsed = JSON.parse(readFileSync(meta, 'utf8'));
    return !(typeof parsed.status === 'number' && parsed.status !== 200);
  } catch {
    return true;
  }
}

/** Internal and public routes are identical in the symmetric `/zh` + `/en` tree. */
function toPublic(route) {
  return route;
}

function prerenderedPostRoutes(locale) {
  const dir = join(APP_DIR, locale, 'posts');
  if (!existsSync(dir)) return [];
  const routes = [];
  const walk = (current, prefix = '') => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(current, entry.name), `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith('.html')) {
        const baseName = entry.name.replace(/\.html$/, '');
        if (!isPublishedPage(current, baseName)) continue;
        routes.push(toPublic(`/${locale}/posts${prefix}/${baseName}`));
      }
    }
  };
  walk(dir);
  return routes;
}

/** Extract hrefs from a prerendered HTML file, normalised to public paths. */
function hrefsFrom(file, pattern = /href="(\/[^"#?]*)"/g) {
  if (!existsSync(file)) return [];
  const html = readFileSync(file, 'utf8');
  return [...html.matchAll(pattern)]
    .map((match) => match[1])
    .filter((href) => href.includes('/posts/'))
    .map(toPublic);
}

function locsFrom(file, tag = 'loc') {
  if (!existsSync(file)) return [];
  const xml = readFileSync(file, 'utf8');
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))]
    .map((match) => match[1])
    .map((value) => {
      try {
        return new URL(value).pathname;
      } catch {
        return value;
      }
    });
}

try {
  const byLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, prerenderedPostRoutes(locale)])
  );
  const prerendered = [...new Set(LOCALES.flatMap((locale) => byLocale[locale]))];

  if (prerendered.length === 0 && !requireArtifacts) {
    console.warn(
      `⚠  No prerendered post pages found under ${APP_DIR}/{zh,en}/posts — the route\n` +
        '   contract checks were NOT evaluated. Expected on a CI filesystem that keeps only\n' +
        '   the deployment output. Use --require-artifacts to treat this as a failure.'
    );
    console.log('\n0/0 checks passed (skipped)');
    process.exit(0);
  }

  console.log(`prerendered post routes: ${prerendered.join(', ') || '(none)'}`);
  for (const locale of LOCALES) {
    check(`${locale} has at least one prerendered post`, byLocale[locale].length > 0);
  }

  // 1. No route may contain an encoded path separator.
  const encoded = prerendered.filter((route) => /%2F/i.test(route));
  check(
    'no prerendered route contains an encoded slash',
    encoded.length === 0,
    encoded.join(', ') || 'none'
  );

  // 2. Every link on each post list page must resolve.
  for (const locale of LOCALES) {
    const hrefs = [...new Set(hrefsFrom(join(APP_DIR, locale, 'posts.html')))];
    console.log(`links on /${locale}/posts: ${hrefs.join(', ') || '(none)'}`);
    const unroutable = hrefs.filter((href) => !prerendered.includes(href));
    check(
      `every link on the ${locale} post list has a generated page`,
      unroutable.length === 0,
      unroutable.join(', ') || 'all resolve'
    );
  }

  // 3. Same for each home page.
  for (const locale of LOCALES) {
    const hrefs = [...new Set(hrefsFrom(join(APP_DIR, locale, 'index.html')))];
    const unroutable = hrefs.filter((href) => !prerendered.includes(href));
    check(
      `every post link on the ${locale} home page has a generated page`,
      unroutable.length === 0,
      unroutable.join(', ') || 'all resolve'
    );
  }

  // 4. The sitemap must agree with the prerendered routes.
  const sitemapPaths = locsFrom(join(APP_DIR, 'sitemap.xml.body')).filter((path) =>
    path.includes('/posts/')
  );
  console.log(`sitemap post paths: ${sitemapPaths.join(', ') || '(none)'}`);
  const unroutableSitemap = sitemapPaths.filter((path) => !prerendered.includes(path));
  check(
    'every sitemap post URL has a generated page',
    unroutableSitemap.length === 0,
    unroutableSitemap.join(', ') || 'all resolve'
  );

  // 5. RSS must agree too.
  for (const locale of LOCALES) {
    const rssPaths = locsFrom(join(APP_DIR, locale, 'rss.xml.body'), 'link')
      .filter((path) => path.includes('/posts/'))
      .map(toPublic);
    const unroutable = rssPaths.filter((path) => !prerendered.includes(path));
    check(
      `every ${locale} rss item URL has a generated page`,
      unroutable.length === 0,
      unroutable.join(', ') || 'all resolve'
    );
  }

  // 6. Nothing prerendered should be missing from the sitemap either.
  const missingFromSitemap = prerendered.filter((route) => !sitemapPaths.includes(route));
  check(
    'every prerendered post is present in the sitemap',
    missingFromSitemap.length === 0,
    missingFromSitemap.join(', ') || 'all present'
  );
} catch (error) {
  check('route contract test completed', false, error.message);
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
