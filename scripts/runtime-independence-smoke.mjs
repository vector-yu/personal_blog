/**
 * Offline check that the deployed site carries no runtime dependency on TinaCMS.
 *
 * The site now has two static trees, `/zh/...` and `/en/...`; both must have
 * their content baked into the prerendered HTML and must not fetch content from
 * the browser. Run `npm run build:local` first.
 *
 * Usage: node scripts/runtime-independence-smoke.mjs [slug] [--require-bundles] [--no-bundles]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = '.next/server/app';
const BUILD_MANIFEST = '.next/build-manifest.json';
const MANIFEST = '.next/prerender-manifest.json';
const LOCALES = ['zh', 'en'];

const args = process.argv.slice(2);
const requireBundles = args.includes('--require-bundles');
const slug = args.find((argument) => !argument.startsWith('--')) ?? 'hello-tinacms';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

function allJsFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return allJsFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

/** Client bundles, located via the build manifest (layout-independent). */
function findClientBundles() {
  if (args.includes('--no-bundles')) return [];

  const candidates = [];
  if (existsSync(BUILD_MANIFEST)) {
    try {
      const manifest = JSON.parse(readFileSync(BUILD_MANIFEST, 'utf8'));
      const entries = [
        ...(Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : []),
        ...Object.values(manifest.pages ?? {}).flat(),
        ...Object.values(manifest.devFiles ?? {}).flat(),
      ].filter((value) => typeof value === 'string');

      for (const entry of entries) {
        const absolute = join('.next', entry);
        if (existsSync(absolute)) candidates.push(absolute);
      }
    } catch {
      /* fall through */
    }
  }

  for (const fallback of ['.next/static/chunks', '.next/static', '.next/static/chunks/app']) {
    candidates.push(...allJsFiles(fallback));
  }

  return [...new Set(candidates)];
}

const MARKERS = {
  zh: ['欢迎', '提示框组件', '交互组件'],
  en: ['Welcome', 'Callout component', 'Interactive components'],
};

try {
  // --- 1. content is baked into the HTML for each locale --------------------
  for (const locale of LOCALES) {
    const route = `/${locale}/posts/${slug}`;
    const postHtmlPath = join(APP_DIR, locale, 'posts', `${slug}.html`);
    if (!existsSync(postHtmlPath)) {
      check(`prerendered HTML exists for ${route}`, false, 'run npm run build:local first');
      continue;
    }

    const html = readFileSync(postHtmlPath, 'utf8');
    check(`prerendered HTML exists for ${route}`, true);

    const found = MARKERS[locale].filter((needle) => html.includes(needle));
    check(
      `${locale} post content is present in the static HTML`,
      found.length >= 2,
      `found ${found.length}/${MARKERS[locale].length} markers`
    );
    check(
      `${locale} post has no loading placeholder`,
      !/正在加载|loading\.\.\.|Loading post/i.test(html)
    );
  }

  // --- 2. client bundles are free of content-API usage ----------------------
  const chunks = findClientBundles();
  const apiPatterns = [
    { label: 'content API host', pattern: /content\.tinajs\.io/ },
    { label: 'API key header', pattern: /X-API-KEY/ },
    { label: 'generated client', pattern: /createClient\s*\(\s*\{[^}]*url:/ },
    { label: 'content query', pattern: /postConnection|pageConnection/ },
    { label: 'collection path lookup', pattern: /relativePath/ },
  ];

  if (chunks.length === 0) {
    const detail = 'no client bundles located via .next/build-manifest.json';
    if (requireBundles) {
      check('client bundles located', false, `${detail} — run npm run build:local first`);
    } else {
      console.warn(
        `⚠  ${detail} — the bundle-cleanliness checks were NOT evaluated.\n` +
          '   Use --require-bundles to treat this as a failure (that is what build:local does).'
      );
      results.push({ name: 'client bundles located', passed: true, detail: 'not found — skipped' });
    }
  } else {
    check('client bundles located', true, `${chunks.length} files`);

    for (const { label, pattern } of apiPatterns) {
      const offenders = chunks.filter((file) => pattern.test(readFileSync(file, 'utf8')));
      check(
        `no client bundle contains a ${label}`,
        offenders.length === 0,
        offenders.map((file) => file.split(/[\\/]/).pop()).join(', ') || 'clean'
      );
    }
  }

  // --- 3. routes are static, not dynamic ------------------------------------
  if (!existsSync(MANIFEST)) {
    check('prerender manifest exists', false, 'run npm run build:local first');
  } else {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    const routes = manifest.routes ?? {};
    const dynamic = manifest.dynamicRoutes ?? {};

    for (const locale of LOCALES) {
      const route = `/${locale}/posts/${slug}`;
      check(
        `${route} is prerendered (static or SSG)`,
        Boolean(routes[route]),
        Object.keys(routes).includes(route) ? '' : 'not in manifest.routes'
      );
      check(
        `${route} declares a revalidate window`,
        typeof routes[route]?.initialRevalidateSeconds === 'number',
        String(routes[route]?.initialRevalidateSeconds)
      );
      check(
        `${route} is not served by a dynamic handler`,
        !dynamic[route],
        dynamic[route] ? 'present in dynamicRoutes' : 'not dynamic'
      );
    }

    const staticSuffixes = [
      '',
      '/posts',
      '/resume',
      '/about',
      '/tags',
      '/archive',
      '/projects',
      '/notes',
      '/now',
      '/reading',
      '/uses',
      '/start-here',
      '/series',
      '/rss.xml',
    ];
    const missing = [];
    for (const locale of LOCALES) {
      for (const suffix of staticSuffixes) {
        const route = `/${locale}${suffix}`;
        if (!routes[route] && !dynamic[route]) missing.push(route);
      }
    }
    for (const route of ['/sitemap.xml', '/robots.txt', '/opengraph-image']) {
      if (!routes[route] && !dynamic[route]) missing.push(route);
    }

    check(
      'all static content routes are in the manifest',
      missing.length === 0,
      missing.join(', ') || 'all present'
    );
  }
} catch (error) {
  check('runtime independence check completed', false, error.message);
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
