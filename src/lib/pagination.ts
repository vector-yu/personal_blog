import { localePath, type Locale } from '@/i18n/config';

export const POSTS_PER_PAGE = 8;

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

export function clampPage(page: number, total: number): number {
  return Math.min(pageCount(total), Math.max(1, page));
}

export function paginate<T>(items: T[], page: number): T[] {
  const safe = clampPage(page, items.length);
  return items.slice((safe - 1) * POSTS_PER_PAGE, safe * POSTS_PER_PAGE);
}

/**
 * Page 1 lives at `/posts` (within the locale root) for a stable canonical URL;
 * later pages use `/posts/page/2`, etc.
 */
export function pagePath(page: number, locale: Locale = 'zh'): string {
  return localePath(locale, page <= 1 ? '/posts' : `/posts/page/${page}`);
}
