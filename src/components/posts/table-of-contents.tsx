'use client';

import { useEffect, useState } from 'react';
import { formatMessage } from '@/i18n/format';
import type { TocHeading } from '@/lib/toc';

export function TableOfContents({
  headings,
  placement = 'desktop',
  labels,
}: {
  headings: TocHeading[];
  placement?: 'desktop' | 'mobile';
  labels: { title: string; sections: string; aria: string };
}) {
  const [active, setActive] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A narrow band just under the sticky header: whichever heading is in it
      // becomes the current one, even when several sections are on screen.
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [headings]);

  const links = headings.map((heading) => {
    const current = active === heading.id;
    return (
      <li
        key={heading.id}
        className={
          heading.level === 3 ? 'pl-6' : heading.level === 2 ? 'pl-3' : undefined
        }
      >
        <a
          href={`#${heading.id}`}
          aria-current={current ? 'location' : undefined}
          className={`-ml-px block border-l-2 py-1 pr-2 pl-3 text-sm leading-snug transition-colors duration-150 ${
            current
              ? 'border-iris font-bold text-ink dark:border-indigo-300 dark:text-white'
              : 'border-transparent text-ink/50 hover:border-ink/25 hover:text-ink/80 dark:text-slate-400 dark:hover:border-chalk/25 dark:hover:text-slate-200'
          }`}
        >
          {heading.text}
        </a>
      </li>
    );
  });

  if (placement === 'mobile') {
    return (
      <details className="mt-8 rounded-2xl border-2 border-ink/15 bg-white/50 backdrop-blur-xl lg:hidden dark:border-chalk/15 dark:bg-white/[0.04]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-iris" />
            {labels.title}
          </span>
          <span aria-hidden className="text-xs text-ink/40 dark:text-slate-500">
            {formatMessage(labels.sections, { count: headings.length })}
          </span>
        </summary>
        <nav aria-label={labels.aria} className="border-t border-ink/10 px-4 py-2 dark:border-chalk/10">
          <ul className="space-y-0.5">{links}</ul>
        </nav>
      </details>
    );
  }

  return (
    <nav aria-label={labels.aria} className="border-l-2 border-ink/10 dark:border-chalk/10">
      <p className="pb-2 pl-3 text-[0.62rem] font-black tracking-[0.2em] text-ink/40 uppercase dark:text-slate-500">
        {labels.title}
      </p>
      <ul className="space-y-0.5">{links}</ul>
    </nav>
  );
}
