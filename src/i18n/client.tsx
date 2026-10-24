'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './config';
import { en } from './messages/en';
import { zh } from './messages/zh';

/** Only the MDX chrome needs a client-side context; page copy is passed as props. */
type MdxCopy = typeof zh.mdx;

const copies: Record<Locale, MdxCopy> = {
  zh: zh.mdx,
  en: en.mdx,
};

const LocaleContext = createContext<{ locale: Locale; copy: MdxCopy }>({
  locale: 'zh',
  copy: copies.zh,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, copy: copies[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleCopy() {
  return useContext(LocaleContext);
}
