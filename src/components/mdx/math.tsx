'use client';

import katex from 'katex';
import { useMemo } from 'react';

/** Strip optional `$` / `$$` delimiters; the editor template stores the raw formula. */
export function normalizeFormula(value?: string | null): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/^\$\$?/, '')
    .replace(/\$\$?$/, '')
    .trim();
}

/**
 * KaTeX renderer used by both the `Math` rich-text template and `math` fenced
 * code blocks.
 *
 * `trust: false` keeps KaTeX from rendering arbitrary `\html`/`\href` input;
 * `throwOnError: false` means a typo shows a KaTeX error instead of taking the
 * article down. `strict: 'ignore'` accepts the full-width punctuation and CJK
 * that show up in Chinese math notes.
 */
export function MathFormula({
  formula,
  display = false,
}: {
  formula?: string | null;
  display?: boolean | null;
}) {
  const source = normalizeFormula(formula);

  const html = useMemo(() => {
    if (!source) return null;
    try {
      return katex.renderToString(source, {
        displayMode: Boolean(display),
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        errorColor: '#b91c1c',
      });
    } catch {
      return null;
    }
  }, [source, display]);

  if (!source) return null;

  if (!html) {
    return (
      <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em] text-rose-700 dark:bg-white/10 dark:text-rose-300">
        {source}
      </code>
    );
  }

  return (
    <span
      className={
        display
          ? 'not-prose my-6 block max-w-full overflow-x-auto text-center'
          : 'not-prose inline-block max-w-full overflow-x-auto align-middle'
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
