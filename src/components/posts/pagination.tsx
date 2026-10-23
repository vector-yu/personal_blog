import Link from 'next/link';
import { pageCount, pagePath } from '@/lib/pagination';

export function Pagination({ total, page }: { total: number; page: number }) {
  const totalPages = pageCount(total);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="文章分页" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <PageLink href={pagePath(page - 1)} label="上一页">
          ← 上一页
        </PageLink>
      ) : null}

      {pages.map((number) =>
        number === page ? (
          <span
            key={number}
            aria-current="page"
            className="grid h-9 min-w-9 place-items-center rounded-full border-2 border-ink/85 bg-ink px-3 text-sm font-black text-paper shadow-brutal-xs dark:border-chalk/40 dark:bg-chalk dark:text-ink dark:shadow-chalk-xs"
          >
            {number}
          </span>
        ) : (
          <Link
            key={number}
            href={pagePath(number)}
            aria-label={`第 ${number} 页`}
            className="grid h-9 min-w-9 place-items-center rounded-full border-2 border-ink/20 bg-white/60 px-3 text-sm font-bold text-ink/65 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/60 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-chalk/40 dark:hover:text-white"
          >
            {number}
          </Link>
        )
      )}

      {page < totalPages ? (
        <PageLink href={pagePath(page + 1)} label="下一页">
          下一页 →
        </PageLink>
      ) : null}
    </nav>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-9 items-center rounded-full border-2 border-ink/20 bg-white/60 px-4 text-sm font-bold text-ink/65 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/60 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-chalk/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-chalk/40 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
