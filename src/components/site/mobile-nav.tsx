'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';

const GROUPS = [
  {
    label: '页面',
    links: [
      { label: '文章', href: '/posts' },
      { label: '项目', href: '/projects' },
      { label: '履历', href: '/resume' },
      { label: '关于', href: '/about' },
    ],
  },
  {
    label: '内容',
    links: [
      { label: '标签', href: '/tags' },
      { label: '归档', href: '/archive' },
      { label: '笔记', href: '/notes' },
      { label: '系列', href: '/series' },
      { label: '从这开始', href: '/start-here' },
    ],
  },
  {
    label: '更多',
    links: [
      { label: 'Now', href: '/now' },
      { label: '阅读', href: '/reading' },
      { label: '工具', href: '/uses' },
      { label: 'RSS', href: '/rss.xml' },
    ],
  },
];

/**
 * The header's four links do not fit at 360–390px together with the brand and
 * the theme toggle. Below `sm` they collapse into this menu; above `sm` the
 * normal nav is used. `<details>` keeps it JS-free apart from the active-link
 * highlight, and the panel is absolutely positioned under the header.
 */
export function MobileNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <details ref={menuRef} className="group relative sm:hidden">
      <summary
        aria-label="打开导航"
        className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl border-2 border-ink/20 bg-white/60 text-ink/70 shadow-brutal-xs backdrop-blur transition-colors hover:border-ink/60 hover:text-ink [&::-webkit-details-marker]:hidden dark:border-chalk/20 dark:bg-white/[0.05] dark:text-slate-300 dark:shadow-chalk-xs dark:hover:border-chalk/50 dark:hover:text-white"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </summary>

      <div className="absolute top-full right-0 z-50 mt-3 max-h-[calc(100vh-5rem)] w-72 overflow-y-auto rounded-2xl border-2 border-ink/25 bg-white/95 p-4 shadow-brutal backdrop-blur-2xl dark:border-chalk/20 dark:bg-midnight/95 dark:shadow-chalk">
        {GROUPS.map((group) => (
          <div key={group.label} className="not-first:mt-5">
            <p className="text-[0.62rem] font-black tracking-[0.18em] text-ink/40 uppercase dark:text-slate-500">
              {group.label}
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={`block rounded-lg px-2.5 py-2 text-sm font-bold transition-colors ${
                        active
                          ? 'bg-ink text-paper dark:bg-chalk dark:text-ink'
                          : 'text-ink/65 hover:bg-white/70 hover:text-ink dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
