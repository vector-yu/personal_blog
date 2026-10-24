'use client';

import { usePathname } from 'next/navigation';
import {
  htmlLang,
  otherLocale,
  switchLocalePath,
  type Locale,
} from '@/i18n/config';

/**
 * Language switch.
 *
 * A plain `<a>` (not `next/link`) is deliberate: changing the `[lang]` root
 * parameter must make the server re-emit `<html lang>`. A client-side
 * navigation keeps the existing document element and can leave the old
 * language on it.
 */
export function LanguageSwitch({
  locale,
  label,
  targetLabel,
}: {
  locale: Locale;
  label: string;
  targetLabel: string;
}) {
  const pathname = usePathname();
  const target = otherLocale(locale);

  return (
    <a
      href={switchLocalePath(pathname, target)}
      hrefLang={htmlLang[target]}
      aria-label={label}
      title={label}
      className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border-2 border-transparent px-2 text-[0.7rem] font-black tracking-wide text-ink/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-white/85 hover:shadow-brutal-xs motion-reduce:hover:translate-y-0 sm:h-10 sm:px-2.5 dark:text-slate-300 dark:hover:border-chalk dark:hover:bg-white/10 dark:hover:shadow-chalk-xs"
    >
      {targetLabel}
    </a>
  );
}
