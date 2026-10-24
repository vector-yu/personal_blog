/**
 * Regression tests for HTTP status codes, now covering both `/zh` and `/en`.
 *
 * Runs against whatever server the given base URL points at, so it works against
 * `npm run dev`, `npm run build:local` + `next start`, and a preview.
 *
 * Usage: node scripts/http-status-smoke.mjs [baseUrl]
 */
const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  await response.text().catch(() => {});
  return { status: response.status, location: response.headers.get('location') };
}

try {
  const cases = [
    { path: '/', expected: 308, label: 'root redirects to /zh' },
    { path: '/zh', expected: 200, label: 'zh home' },
    { path: '/en', expected: 200, label: 'en home' },
    { path: '/zh/posts', expected: 200, label: 'zh post list' },
    { path: '/en/posts', expected: 200, label: 'en post list' },
    { path: '/zh/posts/hello-tinacms', expected: 200, label: 'zh post' },
    { path: '/en/posts/hello-tinacms', expected: 200, label: 'en post' },
    { path: '/zh/resume', expected: 200, label: 'zh resume' },
    { path: '/en/about', expected: 200, label: 'en about' },
    { path: '/zh/tags', expected: 200, label: 'zh tags' },
    { path: '/en/archive', expected: 200, label: 'en archive' },
    { path: '/zh/projects', expected: 200, label: 'zh projects' },
    { path: '/en/notes', expected: 200, label: 'en notes' },
    { path: '/zh/now', expected: 200, label: 'zh now' },
    { path: '/en/reading', expected: 200, label: 'en reading' },
    { path: '/zh/uses', expected: 200, label: 'zh uses' },
    { path: '/en/start-here', expected: 200, label: 'en start here' },
    { path: '/zh/series', expected: 200, label: 'zh series' },
    { path: '/zh/rss.xml', expected: 200, label: 'zh rss' },
    { path: '/en/rss.xml', expected: 200, label: 'en rss' },
    { path: '/sitemap.xml', expected: 200, label: 'sitemap' },
    { path: '/robots.txt', expected: 200, label: 'robots' },
    { path: '/admin/index.html', expected: 200, label: 'tina admin' },
    // Legacy unprefixed URLs must redirect, not 404.
    { path: '/posts', expected: 308, label: 'legacy /posts redirects' },
    { path: '/about', expected: 308, label: 'legacy /about redirects' },
    { path: '/rss.xml', expected: 308, label: 'legacy /rss.xml redirects' },
  ];

  for (const testCase of cases) {
    const { status, location } = await request(testCase.path);
    check(
      `${testCase.label} (${testCase.path}) → ${testCase.expected}`,
      status === testCase.expected,
      `got ${status}${location ? ` → ${location}` : ''}`
    );
  }

  const missing = await request('/zh/posts/definitely-not-a-real-post');
  check('unknown zh post returns 404, not 500', missing.status === 404, `got ${missing.status}`);

  const missingEn = await request('/en/posts/definitely-not-a-real-post');
  check('unknown en post returns 404, not 500', missingEn.status === 404, `got ${missingEn.status}`);

  const missingNested = await request('/zh/posts/nested/also-missing');
  check('unknown nested post returns 404', missingNested.status === 404, `got ${missingNested.status}`);

  const missingLocale = await request('/fr');
  check('unknown locale returns 404', missingLocale.status === 404, `got ${missingLocale.status}`);
} catch (error) {
  check('http status test completed', false, error.message);
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
