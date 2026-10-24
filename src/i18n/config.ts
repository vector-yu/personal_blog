/**
 * Locale configuration for the bilingual site.
 *
 * The URL is the source of truth: every page lives under `/zh/...` or `/en/...`.
 * There is no cookie-only mode, so the same URL always renders the same language
 * and the static build can prerender both trees.
 */

export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

/** Value for `<html lang>`. */
export const htmlLang: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

/** Value for `openGraph.locale`. */
export const ogLocale: Record<Locale, string> = {
  zh: 'zh_CN',
  en: 'en_US',
};

/** Human-readable language name, used by the switcher. */
export const localeName: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'zh' || value === 'en';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'zh' ? 'en' : 'zh';
}

/**
 * Public URL for a path in a locale.
 *
 * Symmetric by design: `/zh/posts` and `/en/posts`. `path` may be `/` or a
 * pathname without a locale prefix; an existing `/zh` or `/en` prefix is
 * stripped first so callers cannot accidentally build `/zh/zh/posts`.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const withoutLocale = stripLocale(clean);
  return withoutLocale === '/'
    ? `/${locale}`
    : `/${locale}${withoutLocale}`;
}

/** Remove a leading `/zh` or `/en` segment from a pathname. */
export function stripLocale(pathname: string): string {
  if (pathname === '/zh' || pathname === '/en') return '/';
  if (pathname.startsWith('/zh/')) return pathname.slice(3);
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  return pathname || '/';
}

/** Locale encoded in a pathname, falling back to the default locale. */
export function localeFromPath(pathname: string): Locale {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  return defaultLocale;
}

/**
 * The language-switch target for the current path.
 *
 * The URL trees are symmetric and translations share the same slug, so the
 * switch is a prefix swap. If a translation is missing, the target route
 * itself decides whether to fall back (e.g. an untranslated post redirects to
 * the target list).
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const rest = stripLocale(pathname);

  // Tag and series names are translated content, so the same path is not
  // guaranteed to exist in the other language. Send the reader to that index.
  if (rest.startsWith('/tags/') || rest.startsWith('/series/')) {
    return localePath(target, rest.startsWith('/tags/') ? '/tags' : '/series');
  }

  // Page counts can differ between languages; the list root always exists.
  if (rest.startsWith('/posts/page/')) return localePath(target, '/posts');

  return localePath(target, rest);
}
