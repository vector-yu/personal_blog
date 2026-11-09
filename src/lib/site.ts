import type { Locale } from '@/i18n/config';

/**
 * Absolute site origin, used by sitemap/robots/RSS and by `metadataBase` in the root layout.
 *
 * Every variable consulted is `NEXT_PUBLIC_`-prefixed on purpose: the root layout is a client
 * component, and Next only inlines `NEXT_PUBLIC_*` names into the browser bundle. A server-only
 * name would be `undefined` on the client, so the server and client would resolve different
 * origins — the same class of bug as the timezone hydration mismatch fixed in `formatDate`.
 *
 * `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` is populated by `next.config.ts`, which re-exports
 * Vercel's non-public `VERCEL_PROJECT_PRODUCTION_URL` under a public name.
 */
export function siteUrl() {
  // Trim before the `||` chain: a value of `" "` is truthy, so an accidental space in an
  // environment variable would otherwise pass straight through and produce an invalid origin
  // (canonical / og:url become a bare space) with nothing reporting an error.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const raw =
    explicit ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'http://localhost:3000';

  return raw.replace(/\/+$/, '');
}

/**
 * Format an ISO date for display in the visitor's language.
 *
 * `timeZone: 'UTC'` is required, not cosmetic: TinaCMS datetime fields are stored as UTC
 * midnight (e.g. 2026-01-15T00:00:00.000Z), and this helper is called from a client
 * component. Without a fixed timezone the server (UTC) prerenders "2026年1月15日" while a
 * visitor in UTC-5 hydrates "2026年1月14日" — a React hydration mismatch, plus an article
 * date that disagrees with the server-rendered list. The locale must likewise be passed
 * explicitly, never inferred from the browser, or the same mismatch returns for English.
 */
export function formatDate(value?: string | null, locale: Locale = 'zh') {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Parse a date string, returning null instead of an Invalid Date. */
export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Compact month/day label for weekly overviews ("9月21日" / "Sep 21").
 *
 * The UTC timezone is required for the same reason as `formatDate`: dates are stored
 * at UTC midnight and the label is rendered on the server.
 */
export function formatMonthDay(value?: string | null, locale: Locale = 'zh') {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

/** Short weekday label ("周一" / "Mon") for a post date. */
export function formatWeekday(value?: string | null, locale: Locale = 'zh') {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en', {
    timeZone: 'UTC',
    weekday: 'short',
  });
}

/**
 * Numeric month/day ("9/21") for the compact week index.
 *
 * The long form wraps inside a seven-column strip at desktop width; this stays on one
 * line and is still unambiguous next to the full range in the week heading.
 */
export function formatNumericMonthDay(value?: string | null) {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

/** Milliseconds since epoch for sorting; invalid/missing dates sort last. */
function sortKey(value?: string | null): number {
  return parseDate(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
}

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export type PostSummary = {
  title: string;
  date: string;
  description: string | null;
  tags: (string | null)[] | null;
  series: string | null;
  featured: boolean;
  /** One-line review from a top-of-post `<ProblemMeta>` card, when present. */
  review: string | null;
  /** Normalized difficulty from the same card; null for ordinary posts. */
  difficulty: ProblemDifficulty | null;
  filename: string;
  /** Path within the collection, e.g. "hello-tinacms.mdx" or "2026/nested.mdx". */
  relativePath: string;
};

type PostEdge = {
  node: {
    title: string;
    date: string;
    description: string | null;
    tags: (string | null)[] | null;
    series?: string | null;
    featured?: boolean | null;
    draft: boolean | null;
    /** MDX rich-text AST; used to read the optional ProblemMeta card. */
    body?: unknown;
    _sys: { filename: string; relativePath: string };
  } | null;
};

type RichTextNode = {
  type?: string;
  name?: string;
  props?: Record<string, unknown>;
  children?: RichTextNode[];
};

function normalizeDifficulty(value: unknown): ProblemDifficulty | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  // The imported Notion table spells it "Eazy" on a few rows.
  if (normalized === 'easy' || normalized === 'eazy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  return null;
}

/**
 * Read the optional `<ProblemMeta review="…" difficulty="…" />` card from the MDX body.
 *
 * The card is intentionally a plain first-child node, so a shallow scan is enough and
 * keeps this cheap for list pages (the generated connection query already ships `body`
 * for every post). Anything unexpected degrades to null instead of breaking the list.
 */
function problemMetaFromBody(body: unknown): {
  review: string | null;
  difficulty: ProblemDifficulty | null;
} {
  const root = body as RichTextNode | null;
  const children = Array.isArray(root?.children) ? root.children : [];

  for (const child of children) {
    if (child?.type !== 'mdxJsxFlowElement' || child.name !== 'ProblemMeta') continue;
    const review = typeof child.props?.review === 'string' ? child.props.review.trim() : '';
    return {
      review: review || null,
      difficulty: normalizeDifficulty(child.props?.difficulty),
    };
  }

  return { review: null, difficulty: null };
}

/**
 * The single funnel for turning post edges into displayable summaries: drops null edges,
 * drops drafts, and sorts newest-first.
 *
 * Draft handling lives here on purpose — `generateStaticParams` must apply the same rule
 * (see `isPublished`), otherwise a draft would be absent from lists/sitemap but still
 * prerendered and publicly reachable at its own URL.
 */
export function toPostSummaries(
  edges: (PostEdge | null)[] | null | undefined
): PostSummary[] {
  return (edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<PostEdge['node']> => Boolean(node))
    .filter((node) => !node.draft)
    .map((node) => ({
      title: node.title,
      date: node.date,
      description: node.description,
      tags: node.tags,
      series: node.series?.trim() || null,
      featured: node.featured === true,
      ...problemMetaFromBody(node.body),
      filename: node._sys.filename,
      relativePath: node._sys.relativePath,
    }))
    .sort((a, b) => sortKey(b.date) - sortKey(a.date));
}

/**
 * The URL slug for a post.
 *
 * This MUST be used everywhere a post is linked, and it must derive from `relativePath`,
 * not `filename`. `filename` is only the basename, so a post in a subfolder
 * (`content/posts/2026/new-post.mdx`) is prerendered at `/posts/2026/new-post` (that is what
 * `generateStaticParams` and the sitemap/RSS use) but would be linked as `/posts/new-post` —
 * a 404.
 */
export function postSlug(post: Pick<PostSummary, 'relativePath'>): string {
  return post.relativePath.replace(/\.mdx?$/, '');
}
