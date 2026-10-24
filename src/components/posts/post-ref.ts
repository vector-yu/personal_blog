/** Minimal post shape used for next/previous and related links. */
export type PostRef = {
  slug: string;
  /** Locale-aware link, computed on the server. */
  href: string;
  title: string;
  dateLabel: string;
  tags: string[];
};
