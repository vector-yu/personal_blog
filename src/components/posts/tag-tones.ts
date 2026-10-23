/**
 * Tag chips cycle through the four accent colours by position, and each chip's
 * hard shadow is the SAME hue as its border — a small detail that makes the row
 * read as a set of coloured stickers rather than four identical pills. The text
 * steps are the darker ones so every chip clears WCAG AA against its own tinted
 * background — see STYLE-DIRECTIONS.md §4.
 */
export const TAG_TONES = [
  'border-iris/45 bg-iris/12 text-iris-text shadow-brutal-iris-xs dark:border-iris/40 dark:bg-iris/20 dark:text-indigo-200',
  'border-blush/45 bg-blush/12 text-rose-700 shadow-brutal-blush-xs dark:border-blush/40 dark:bg-blush/20 dark:text-rose-200',
  'border-sun/60 bg-sun/25 text-amber-800 shadow-brutal-sun-xs dark:border-sun/35 dark:bg-sun/15 dark:text-amber-200',
  'border-mint/45 bg-mint/15 text-emerald-800 shadow-brutal-mint-xs dark:border-mint/35 dark:bg-mint/15 dark:text-emerald-200',
] as const;

export function tagTone(tag: string, tags: string[]) {
  return TAG_TONES[Math.max(0, tags.indexOf(tag)) % TAG_TONES.length];
}
