import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

type MarkdownNode = {
  type?: string;
  text?: string;
  children?: MarkdownNode[];
  [key: string]: unknown;
};

/**
 * URL fragment for a heading. Chinese characters are kept (valid in an HTML id
 * and in a URL fragment); punctuation and spacing are normalised so the TOC and
 * the rendered `<h2 id>` agree.
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/['"’“”]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'section';
}

function nodeText(node: MarkdownNode): string {
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
}

/**
 * Pull the h2/h3 outline out of the Tina rich-text AST.
 *
 * The `h2`/`h3` renderers in `tina-markdown.tsx` build their ids from the same
 * `slugifyHeading`, so the TOC links always match the rendered headings. A
 * repeated heading text would produce a repeated id; that is rare enough that it
 * is not worth a positional id that the heading renderer cannot reconstruct.
 */
export function extractHeadings(
  content: TinaMarkdownContent | TinaMarkdownContent[] | null | undefined
): TocHeading[] {
  const headings: TocHeading[] = [];
  const roots = Array.isArray(content) ? content : content ? [content] : [];

  const walk = (node: MarkdownNode) => {
    if (!node || typeof node !== 'object') return;

    const level = node.type === 'h2' ? 2 : node.type === 'h3' ? 3 : null;
    if (level) {
      const text = nodeText(node).trim();
      if (text) headings.push({ id: slugifyHeading(text), text, level });
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  };

  for (const root of roots) walk(root as MarkdownNode);
  return headings;
}

/** Plain text of the whole document, used for the reading-time estimate. */
export function contentText(
  content: TinaMarkdownContent | TinaMarkdownContent[] | null | undefined
): string {
  const roots = Array.isArray(content) ? content : content ? [content] : [];
  return roots.map((node) => nodeText(node as MarkdownNode)).join(' ');
}

/**
 * A deliberately coarse reading-time estimate: 350 CJK characters or 200 Latin
 * words per minute, whichever part dominates. It is a label, not a promise.
 */
export function estimateReadingMinutes(
  content: TinaMarkdownContent | TinaMarkdownContent[] | null | undefined
): number {
  const text = contentText(content);
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 350 + latinWords / 200));
}
