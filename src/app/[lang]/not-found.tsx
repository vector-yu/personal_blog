import { NotFoundView } from '@/components/site/not-found-view';
import { messagesFor, getLocale } from '@/i18n/server';

/**
 * 404 for a URL that matched `[lang]` but no page inside it (e.g.
 * `/zh/posts/missing`). The root params are available here, so the page is
 * localized.
 */
export default async function LangNotFound() {
  const locale = await getLocale();
  return <NotFoundView locale={locale} messages={messagesFor(locale)} />;
}
