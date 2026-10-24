import type { Metadata } from 'next';
import { getHomeContent } from '@/lib/home';
import { metadataBaseUrl } from '@/lib/site-url';
import {
  htmlLang,
  localePath,
  ogLocale,
  otherLocale,
  type Locale,
} from './config';

/**
 * Canonical + hreflang + Open Graph for one page.
 *
 * `translated` is false when the counterpart does not exist (e.g. an
 * untranslated post): in that case the other language is deliberately omitted
 * from hreflang rather than pointing at a page that would 404.
 */
export async function buildMetadata({
  locale,
  path,
  title,
  description,
  siteName,
  image,
  type = 'website',
  publishedTime,
  translated = true,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  siteName?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  translated?: boolean;
}): Promise<Metadata> {
  const home = await getHomeContent(locale);
  const resolvedSiteName = siteName ?? home.siteName;
  const canonical = localePath(locale, path);
  const other = otherLocale(locale);
  const languages: Record<string, string> = translated
    ? {
        [htmlLang.zh]: localePath('zh', path),
        [htmlLang.en]: localePath('en', path),
        'x-default': localePath('zh', path),
      }
    : {
        [htmlLang[locale]]: canonical,
        'x-default': canonical,
      };

  return {
    metadataBase: metadataBaseUrl(),
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type,
      siteName: resolvedSiteName,
      title,
      description,
      url: canonical,
      locale: ogLocale[locale],
      alternateLocale: translated ? [ogLocale[other]] : undefined,
      ...(publishedTime ? { publishedTime } : {}),
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
