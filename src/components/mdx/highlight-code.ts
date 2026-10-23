/**
 * Tiny, dependency-free syntax highlighter for code blocks.
 *
 * The code block is always rendered on a near-black panel (in both themes), so
 * the palette is tuned for that background. It is deliberately a token colourer,
 * not a parser: strings/comments are matched first, then numbers, literals,
 * keywords, calls, object keys, types and punctuation. That covers the
 * TypeScript/JS/JSON/CSS snippets this blog actually contains without pulling
 * Prism/Shiki into the client bundle.
 *
 * The class names are literal strings in `TOKEN_CLASS` so Tailwind's scanner
 * emits them.
 */
const TOKEN_CLASS = {
  comment: 'text-slate-500 italic',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  literal: 'text-amber-300',
  keyword: 'text-rose-300',
  function: 'text-sky-300',
  property: 'text-indigo-200',
  type: 'text-violet-300',
  punctuation: 'text-slate-400',
  plain: 'text-slate-200',
} as const;

export type CodeTokenKind = keyof typeof TOKEN_CLASS;

export type CodeToken = {
  text: string;
  kind: CodeTokenKind;
};

const TOKEN_PATTERN =
  /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<string>'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(?<number>\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(?<literal>\b(?:true|false|null|undefined)\b)|(?<keyword>\b(?:export|default|const|let|var|function|return|if|else|for|while|import|from|new|class|extends|implements|interface|type|as|async|await|try|catch|finally|throw|switch|case|break|continue|of|in|instanceof|typeof|void|delete|readonly|public|private|protected|static|enum|namespace|declare|satisfies|keyof|infer|is|yield|this|super)\b)|(?<function>[A-Za-z_$][\w$]*(?=\s*\())|(?<property>[A-Za-z_$][\w$]*(?=\s*:))|(?<type>\b[A-Z][A-Za-z0-9_$]*\b)|(?<punctuation>[{}[\]();,.:=+\-*\/%<>!?&|]+)/g;

/**
 * Split source into coloured tokens. Whitespace and unclassified text are kept
 * as `plain` tokens, so the caller can render the array back as the exact
 * original string.
 */
export function highlightCode(code: string): CodeToken[] {
  if (!code) return [];

  const tokens: CodeToken[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, index), kind: 'plain' });
    }

    const groups = match.groups ?? {};
    const kind = (Object.keys(TOKEN_CLASS) as CodeTokenKind[]).find(
      (candidate) => candidate !== 'plain' && Boolean(groups[candidate])
    );

    tokens.push({ text: match[0], kind: kind ?? 'plain' });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), kind: 'plain' });
  }

  return tokens;
}

export function codeTokenClass(kind: CodeTokenKind): string {
  return TOKEN_CLASS[kind];
}
