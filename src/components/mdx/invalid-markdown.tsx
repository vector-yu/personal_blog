'use client';

import { useState } from 'react';
import { useLocaleCopy } from '@/i18n/client';

export interface InvalidMarkdownProps {
  value?: string;
  message?: string;
}

/**
 * Fallback renderer for the node TinaCMS's MDX parser emits when it cannot parse a body.
 *
 * The parser replaces the ENTIRE body with a single `invalid_markdown` node on any failure
 * (an unknown attribute on an embed, an attribute whose type does not match the template
 * field, etc.). The default TinaMarkdown rendering for that node dumps the raw MDX into a
 * <pre>, so the article silently shows its own source. This makes the failure explicit
 * instead — visible locally while editing, and a collapsed note in production.
 *
 * Styling stays deliberately loud (thick amber/rose outline, hard offset shadow) so a
 * failure can never be mistaken for a styled content block.
 */
export function InvalidMarkdown({ value, message }: InvalidMarkdownProps) {
  const { copy } = useLocaleCopy();
  const [open, setOpen] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return (
      <div className="not-prose my-8 rounded-2xl border-4 border-amber-300 bg-amber-50/85 p-5 text-sm text-amber-950 shadow-brutal backdrop-blur-xl dark:border-amber-300/60 dark:bg-amber-500/10 dark:text-amber-50 dark:shadow-chalk">
        <p className="font-black">{copy.invalidTitle}</p>
        <p className="mt-1">{copy.invalidBody}</p>
        {message ? <p className="mt-1 text-xs opacity-70">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="not-prose my-8 rounded-2xl border-4 border-dashed border-rose-400 bg-rose-50/85 p-5 text-sm text-rose-950 shadow-brutal backdrop-blur-xl dark:bg-rose-500/10 dark:text-rose-50 dark:shadow-chalk">
      <p className="font-black">{copy.invalidDevTitle}</p>
      {message ? <p className="mt-1 font-mono text-xs">{message}</p> : null}
      <p className="mt-2 text-xs">{copy.invalidDevBody}</p>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="mt-3 rounded-full border-2 border-rose-400 bg-white/70 px-3 py-0.5 text-xs font-bold shadow-brutal-xs transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 dark:bg-white/10 dark:shadow-chalk-xs"
      >
        {open ? copy.hideSource : copy.showSource}
      </button>
      {open ? (
        <pre className="mt-3 max-h-60 overflow-auto rounded-xl border-2 border-rose-400/60 bg-rose-900/10 p-3 font-mono text-xs whitespace-pre-wrap">
          {value ?? '(no source)'}
        </pre>
      ) : null}
    </div>
  );
}
