import { cache } from 'react';
import { lang } from 'next/root-params';
import { defaultLocale, isLocale, type Locale } from './config';
import { messages, type Messages } from './messages';

/**
 * Current locale for a Server Component / server-side utility.
 *
 * `next/root-params` reads the `[lang]` root segment without prop drilling;
 * it is server-only and cannot be used inside Route Handlers (sitemap/RSS pass
 * the locale explicitly instead).
 *
 * An unknown value falls back to the default rather than calling `notFound()`
 * here: `[lang]/not-found.tsx` also asks for the locale, and throwing from this
 * helper there would recurse. The root layout is the place that rejects an
 * unsupported segment.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = await lang();
  return isLocale(value) ? value : defaultLocale;
});

export const getMessages = cache(async (): Promise<Messages> => {
  return messages[await getLocale()];
});

/** For Route Handlers and other places without a root-params context. */
export function messagesFor(locale: Locale): Messages {
  return messages[locale];
}
