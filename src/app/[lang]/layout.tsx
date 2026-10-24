import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Backdrop } from '@/components/site/backdrop';
import { LanguageSwitch } from '@/components/site/language-switch';
import { MotionProvider } from '@/components/site/motion-provider';
import { PageTransition } from '@/components/site/page-transition';
import { MobileNav } from '@/components/site/mobile-nav';
import { SocialLinks } from '@/components/site/social-links';
import { ThemeToggle } from '@/components/site/theme-toggle';
import {
  htmlLang,
  isLocale,
  localeName,
  localePath,
  locales,
  ogLocale,
  otherLocale,
  type Locale,
} from '@/i18n/config';
import { formatMessage } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { messagesFor } from '@/i18n/server';
import { getHomeContent, type HomeSocial } from '@/lib/home';
import { metadataBaseUrl } from '@/lib/site-url';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import '../globals.css';

type Params = { lang: string };

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'zh';
  const [{ siteName, tagline }, messages] = await Promise.all([
    getHomeContent(locale),
    Promise.resolve(messagesFor(locale)),
  ]);
  const description = tagline || messages.common.siteDescription;

  return {
    metadataBase: metadataBaseUrl(),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: {
      types: {
        'application/rss+xml': localePath(locale, '/rss.xml'),
      },
      languages: {
        'zh-CN': localePath('zh', '/'),
        en: localePath('en', '/'),
        'x-default': localePath('zh', '/'),
      },
    },
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      locale: ogLocale[locale],
      alternateLocale: [ogLocale[otherLocale(locale)]],
    },
    twitter: {
      card: 'summary',
      title: siteName,
      description,
    },
  };
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border-2 border-transparent px-2.5 py-1.5 font-bold whitespace-nowrap text-ink/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-white/85 hover:text-ink hover:shadow-brutal-xs motion-reduce:hover:translate-y-0 sm:px-3 dark:text-slate-300 dark:hover:border-chalk dark:hover:bg-white/10 dark:hover:text-white dark:hover:shadow-chalk-xs"
    >
      {children}
    </Link>
  );
}

type NavGroup = { label: string; links: { label: string; href: string }[] };

function navGroups(locale: Locale, messages: Messages): NavGroup[] {
  return [
    {
      label: messages.footer.browse,
      links: [
        { label: messages.nav.posts, href: localePath(locale, '/posts') },
        { label: messages.nav.projects, href: localePath(locale, '/projects') },
        { label: messages.nav.resume, href: localePath(locale, '/resume') },
        { label: messages.nav.about, href: localePath(locale, '/about') },
      ],
    },
    {
      label: messages.footer.content,
      links: [
        { label: messages.nav.tags, href: localePath(locale, '/tags') },
        { label: messages.nav.archive, href: localePath(locale, '/archive') },
        { label: messages.nav.notes, href: localePath(locale, '/notes') },
        { label: messages.nav.series, href: localePath(locale, '/series') },
        { label: messages.nav.startHere, href: localePath(locale, '/start-here') },
      ],
    },
    {
      label: messages.footer.more,
      links: [
        { label: messages.nav.now, href: localePath(locale, '/now') },
        { label: messages.nav.reading, href: localePath(locale, '/reading') },
        { label: messages.nav.uses, href: localePath(locale, '/uses') },
        { label: messages.nav.rss, href: localePath(locale, '/rss.xml') },
      ],
    },
  ];
}

function SiteHeader({
  siteName,
  locale,
  messages,
}: {
  siteName: string;
  locale: Locale;
  messages: Messages;
}) {
  const groups = navGroups(locale, messages);
  const target = otherLocale(locale);
  const languageLabel = formatMessage(messages.language.switchToLabel, {
    language: localeName[target],
  });

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink/10 bg-white/60 backdrop-blur-xl backdrop-saturate-150 print:hidden dark:border-chalk/10 dark:bg-midnight/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link
          href={localePath(locale, '/')}
          className="group inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gradient-to-br from-sun via-blush to-iris shadow-brutal-xs transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100 dark:border-chalk dark:shadow-chalk-xs"
          >
            <span className="h-3 w-3 rotate-45 rounded-[3px] bg-ink/90 dark:bg-midnight/90" />
          </span>
          <span className="max-w-[42vw] truncate text-base font-black tracking-tight sm:max-w-none">
            {siteName}
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 text-sm sm:flex sm:gap-1">
          <NavLink href={localePath(locale, '/posts')}>{messages.nav.posts}</NavLink>
          <NavLink href={localePath(locale, '/projects')}>{messages.nav.projects}</NavLink>
          <NavLink href={localePath(locale, '/resume')}>{messages.nav.resume}</NavLink>
          <NavLink href={localePath(locale, '/about')}>{messages.nav.about}</NavLink>
          <LanguageSwitch
            locale={locale}
            label={languageLabel}
            targetLabel={
              target === 'en'
                ? messages.language.switchToEnglish
                : messages.language.switchToChinese
            }
          />
          <ThemeToggle label={messages.theme.toggle} />
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <LanguageSwitch
            locale={locale}
            label={languageLabel}
            targetLabel={
              target === 'en'
                ? messages.language.switchToEnglish
                : messages.language.switchToChinese
            }
          />
          <ThemeToggle label={messages.theme.toggle} />
          <MobileNav groups={groups} openLabel={messages.nav.openMenu} />
        </div>
      </nav>
    </header>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-black tracking-[0.18em] text-ink/45 uppercase dark:text-slate-500">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm font-bold">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-1.5 text-ink/65 underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-ink hover:decoration-iris dark:text-slate-300 dark:hover:text-white dark:hover:decoration-iris"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SiteFooter({
  siteName,
  tagline,
  socials,
  locale,
  messages,
}: {
  siteName: string;
  tagline: string;
  socials: HomeSocial[];
  locale: Locale;
  messages: Messages;
}) {
  const groups = navGroups(locale, messages);

  return (
    <footer className="relative z-10 mt-20 print:hidden">
      <div className="border-t-2 border-ink/15 bg-white/55 backdrop-blur-xl dark:border-chalk/15 dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <Link href={localePath(locale, '/')} className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-gradient-to-br from-sun via-blush to-iris shadow-brutal-xs dark:border-chalk dark:shadow-chalk-xs"
              >
                <span className="h-3 w-3 rotate-45 rounded-[3px] bg-ink/90 dark:bg-midnight/90" />
              </span>
              <span className="text-lg font-black tracking-tight">{siteName}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed font-medium text-ink/60 dark:text-slate-400">
              {tagline}
            </p>
            <SocialLinks socials={socials} className="mt-5" />
          </div>

          <FooterColumn title={groups[0].label} links={groups[0].links} />
          <FooterColumn title={groups[1].label} links={groups[1].links} />
          <FooterColumn title={groups[2].label} links={groups[2].links} />
        </div>

        <div className="border-t border-ink/10 dark:border-chalk/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} {siteName} · {messages.footer.builtWith}
            </p>
            <div className="flex items-center gap-4">
              <Link
                href={localePath(locale, '/rss.xml')}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/20 bg-white/60 px-3 py-1.5 text-xs font-bold text-ink/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/70 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/20 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-chalk/50 dark:hover:text-white"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
                </svg>
                {messages.common.rssSubscribe}
              </Link>
              <div aria-hidden className="hidden items-center gap-2 sm:flex">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-sun dark:border-chalk" />
                <span className="h-3.5 w-3.5 rotate-12 rounded-[4px] border-2 border-ink bg-blush dark:border-chalk" />
                <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-mint dark:border-chalk" />
                <span className="h-3.5 w-3.5 -rotate-12 rounded-[4px] border-2 border-ink bg-iris dark:border-chalk" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const [home, messages] = await Promise.all([
    getHomeContent(locale),
    Promise.resolve(messagesFor(locale)),
  ]);

  return (
    <html lang={htmlLang[locale]} suppressHydrationWarning>
      <body className="isolate flex min-h-screen flex-col overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <MotionProvider>
          <Backdrop />
          <SiteHeader siteName={home.siteName} locale={locale} messages={messages} />
          <div className="flex-1">
            <PageTransition>{children}</PageTransition>
          </div>
          <SiteFooter
            siteName={home.siteName}
            tagline={home.tagline}
            socials={home.socials}
            locale={locale}
            messages={messages}
          />
        </MotionProvider>
      </body>
    </html>
  );
}
