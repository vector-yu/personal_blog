import { cache } from 'react';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import { client } from '@/lib/tina';

export type NoteItem = {
  date: string;
  title: string;
  body: TinaMarkdownContent | null;
  tags: string[];
};

export type NotesContent = {
  intro: string;
  items: NoteItem[];
};

export const NOTES_RELATIVE_PATH = 'notes.json';

export const DEFAULT_NOTES: NotesContent = {
  intro: '短一点的记录。',
  items: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asMarkdownBody(value: unknown): TinaMarkdownContent | null {
  if (Array.isArray(value)) return value as unknown as TinaMarkdownContent;
  if (typeof value === 'object' && value !== null) {
    const record = value as { type?: unknown; children?: unknown };
    // A JSON rich-text field can be saved with its root wrapper by hand; the
    // renderer wants the children array. Unwrap it defensively.
    if (record.type === 'root' && Array.isArray(record.children)) {
      return record.children as unknown as TinaMarkdownContent;
    }
    return value as unknown as TinaMarkdownContent;
  }
  return null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item): item is string => item.length > 0)
    ),
  ];
}

export function normaliseNotes(value: unknown): NotesContent {
  const record = asRecord(value);
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    intro: asText(record.intro) || DEFAULT_NOTES.intro,
    items: items
      .map((entry) => {
        const note = asRecord(entry);
        const date = asText(note.date);
        return {
          date,
          title: asText(note.title),
          body: asMarkdownBody(note.body),
          tags: asStringList(note.tags),
        };
      })
      .filter((note) => note.date.length > 0)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  };
}

export const getNotes = cache(async (): Promise<NotesContent> => {
  try {
    const { data } = await client.queries.note({ relativePath: NOTES_RELATIVE_PATH });
    return normaliseNotes(data?.note);
  } catch (error) {
    console.error('Failed to load the notes document:', error);
    return DEFAULT_NOTES;
  }
});
