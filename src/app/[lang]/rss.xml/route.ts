import { htmlLang, isLocale, localePath, locales, type Locale } from '@/i18n/config';
import { messagesFor } from '@/i18n/server';
import { getHomeContent } from '@/lib/home';
import { getPosts } from '@/lib/posts';
import { parseDate, postSlug, siteUrl } from '@/lib/site';

export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'zh';
  const messages = messagesFor(locale);
  const base = siteUrl();
  const [posts, home] = await Promise.all([getPosts(locale), getHomeContent(locale)]);
  const title = home.siteName;
  const description = home.tagline || messages.common.siteDescription;
  const feedUrl = `${base}${localePath(locale, '/rss.xml')}`;
  const homeUrl = `${base}${localePath(locale, '/')}`;

  const items = posts
    .map((post) => {
      const url = `${base}${localePath(locale, `/posts/${postSlug(post)}`)}`;
      const published = parseDate(post.date);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
${published ? `      <pubDate>${published.toUTCString()}</pubDate>\n` : ''}${post.description ? `      <description>${escapeXml(post.description)}</description>\n` : ''}    </item>`;
    })
    .join('\n');

  // The stylesheet processing instruction must sit between the XML declaration and
  // the root element. Feed readers ignore it; a browser renders /rss.xsl instead of
  // showing a wall of raw XML.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${homeUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>${htmlLang[locale]}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      /*
       * `application/xml`, deliberately NOT `application/rss+xml`.
       *
       * Chrome treats the feed MIME types as plain text on navigation, so the
       * stylesheet instruction is ignored and a visitor sees raw XML. Feed
       * readers accept `application/xml` universally.
       */
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
