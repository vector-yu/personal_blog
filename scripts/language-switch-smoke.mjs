/**
 * Language-switch and mobile-header smoke test.
 *
 * Covers the behaviour that cannot be inferred from the HTML:
 *  - the switch goes to the equivalent page (same slug), not the home page;
 *  - tag detail pages fall back to the tag index because tag names are translated;
 *  - the `<html lang>` attribute changes (a full navigation is used on purpose);
 *  - the extra header control does not overflow at 360 / 390px.
 *
 * Usage: node scripts/language-switch-smoke.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

try {
  for (const width of [360, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/zh/posts`, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForTimeout(800);

    check(
      `${width}px zh page has html lang=zh-CN`,
      (await page.locator('html').getAttribute('lang')) === 'zh-CN'
    );

    const overflow = await page.evaluate(() => {
      const header = document.querySelector('header nav');
      if (!header) return null;
      return {
        scrollWidth: header.scrollWidth,
        clientWidth: header.clientWidth,
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    check(
      `${width}px header has no horizontal overflow`,
      overflow !== null &&
        overflow.scrollWidth <= overflow.clientWidth + 1 &&
        overflow.documentOverflow <= 1,
      JSON.stringify(overflow)
    );

    const switchLink = page.locator('a[href="/en/posts"]:visible').first();
    check(`${width}px switch points to /en/posts`, (await switchLink.count()) > 0);
    await switchLink.click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(800);

    check(
      `${width}px switch lands on /en/posts`,
      new URL(page.url()).pathname === '/en/posts',
      page.url()
    );
    check(
      `${width}px English page has html lang=en`,
      (await page.locator('html').getAttribute('lang')) === 'en'
    );
    check(`${width}px English page shows English nav`, /Writing/.test(await page.locator('body').innerText()));

    await context.close();
  }

  // Equivalent post: same slug.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/zh/posts/hello-tinacms`, { waitUntil: 'load' });
  const postSwitch = page.locator('a[href="/en/posts/hello-tinacms"]:visible').first();
  check('post switch keeps the slug', (await postSwitch.count()) > 0);

  // Tag detail falls back to the tag index (tag names are content).
  await page.goto(`${baseUrl}/zh/tags/TinaCMS`, { waitUntil: 'load' });
  const tagSwitch = page.locator('a[href="/en/tags"]:visible').first();
  check('tag switch goes to the tag index', (await tagSwitch.count()) > 0);

  // Root redirects to the default locale.
  const response = await page.request.get(`${baseUrl}/`, { maxRedirects: 0 });
  check('root redirects to /zh', response.status() === 308, `status=${response.status()}`);

  await context.close();
} catch (error) {
  check('language switch smoke completed', false, error.message);
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
