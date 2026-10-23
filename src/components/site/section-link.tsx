import Link from 'next/link';

/** Small secondary navigation pill used under page headers. */
export function SectionLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        active
          ? 'border-ink/85 bg-ink text-paper shadow-brutal-xs dark:border-chalk/40 dark:bg-chalk dark:text-ink dark:shadow-chalk-xs'
          : 'border-ink/20 bg-white/60 text-ink/65 hover:border-ink/60 hover:text-ink dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-chalk/40 dark:hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}
