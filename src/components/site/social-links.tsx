import type { HomeSocial, HomeSocialKind } from '@/lib/home';

/**
 * Social links rendered as small glass stamps.
 *
 * The URL is normalised and scheme-checked in `normaliseHome` (rejects
 * `javascript:` etc.), so this component only decides presentation. The visible
 * text is the label from the CMS; the icon is decorative. External http(s) links
 * open in a new tab; mailto/tel/relative links stay in place.
 */
const ICON_PATHS: Record<HomeSocialKind, React.ReactNode> = {
  github: (
    <path
      d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.8c-2.6.6-3.2-1.1-3.2-1.1-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.1-.2-4.3-1-4.3-4.6 0-1 .4-1.9 1-2.5-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  email: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  x: (
    <path
      d="M4 3h4.3l4.1 5.7L17.3 3H21l-6.3 8.1L21.5 21h-4.4l-4.5-6.4L7.3 21H3.6l6.7-8.6L4 3Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  bilibili: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M7 2.5 10 6M17 2.5 14 6" />
      <path d="M8 12.5h.01M16 12.5h.01" />
    </>
  ),
  rss: <path d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />,
  link: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M7 17l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0M17 7l1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" />
    </>
  ),
};

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export function SocialLinks({
  socials,
  className = '',
}: {
  socials: HomeSocial[];
  className?: string;
}) {
  if (socials.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socials.map((social) => (
        <li key={`${social.kind}-${social.url}`}>
          <a
            href={social.url}
            {...(isExternal(social.url) ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            aria-label={social.label}
            title={social.label}
            className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink/20 bg-white/60 text-ink/70 shadow-brutal-xs backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/70 hover:bg-white/90 hover:text-ink hover:shadow-brutal-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/20 dark:bg-white/[0.05] dark:text-slate-300 dark:shadow-chalk-xs dark:hover:border-chalk/50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICON_PATHS[social.kind]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
