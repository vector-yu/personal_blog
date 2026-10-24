import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { sanitizeUrl } from '@/components/mdx/sanitize-url';
import { client } from '@/lib/tina';

export type ReadingStatus = 'reading' | 'finished' | 'wishlist';

export type Book = {
  title: string;
  author: string;
  status: ReadingStatus;
  rating: number;
  note: string;
  cover: string | null;
  link: string | null;
};

export type ReadingContent = {
  intro: string;
  books: Book[];
};

export const READING_RELATIVE_PATH = 'reading.json';
export const READING_RELATIVE_PATH_EN = 'reading.en.json';

export const DEFAULT_READING: ReadingContent = {
  intro: '最近读过的书，以及在读和想读的清单。',
  books: [],
};

export const DEFAULT_READING_EN: ReadingContent = {
  intro: 'Books I have read, am reading, and want to read.',
  books: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStatus(value: unknown): ReadingStatus {
  return value === 'reading' || value === 'finished' || value === 'wishlist' ? value : 'wishlist';
}

export function normaliseReading(
  value: unknown,
  defaults: ReadingContent = DEFAULT_READING
): ReadingContent {
  const record = asRecord(value);
  const books = Array.isArray(record.books) ? record.books : [];

  return {
    intro: asText(record.intro) || defaults.intro,
    books: books
      .map((entry) => {
        const book = asRecord(entry);
        const rating = typeof book.rating === 'number' && Number.isFinite(book.rating) ? book.rating : 0;
        return {
          title: asText(book.title),
          author: asText(book.author),
          status: asStatus(book.status),
          rating: Math.min(5, Math.max(0, Math.round(rating))),
          note: asText(book.note),
          cover: sanitizeUrl(asText(book.cover)) ?? null,
          link: sanitizeUrl(asText(book.link)) ?? null,
        };
      })
      .filter((book) => book.title.length > 0),
  };
}

export const getReading = cache(async (locale: Locale = 'zh'): Promise<ReadingContent> => {
  const isEn = locale === 'en';
  try {
    const { data } = await client.queries.reading({
      relativePath: isEn ? READING_RELATIVE_PATH_EN : READING_RELATIVE_PATH,
    });
    return normaliseReading(data?.reading, isEn ? DEFAULT_READING_EN : DEFAULT_READING);
  } catch (error) {
    console.error(`Failed to load the reading document (${locale}):`, error);
    return isEn ? DEFAULT_READING_EN : DEFAULT_READING;
  }
});
