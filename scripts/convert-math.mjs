/**
 * Convert `$...$` / `$$...$$` math in Markdown/MDX files to the Tina-safe
 * `<Math formula="..." />` form.
 *
 * Why not a plain search/replace:
 *  - `$` inside fenced code blocks and inline code must stay untouched;
 *  - frontmatter must stay untouched;
 *  - formulas containing `"`, `&`, `<` or `>` need a JSON-string expression
 *    attribute so MDX can parse them;
 *  - currency like `$5` must not become math (default heuristic; `--all`
 *    disables it for simple variables such as `$x$`).
 *
 * Usage:
 *   node scripts/convert-math.mjs                  # dry run, repo content dirs
 *   node scripts/convert-math.mjs --write          # write changes
 *   node scripts/convert-math.mjs --check          # exit 1 if changes exist
 *   node scripts/convert-math.mjs --all --write    # also convert simple $x$
 *   node scripts/convert-math.mjs --write /path/to/notes
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parseMDX } from '@tinacms/mdx';

const args = process.argv.slice(2);
const write = args.includes('--write');
const check = args.includes('--check');
const all = args.includes('--all');
const verbose = args.includes('--verbose');
const targets = args.filter((arg) => !arg.startsWith('--'));
if (targets.length === 0) {
  targets.push('content/posts', 'content/posts-en', 'content/pages', 'content/pages-en');
}

const results = [];
const checkResult = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const MATH_FIELD = {
  type: 'rich-text',
  name: 'body',
  parser: { type: 'mdx' },
  templates: [
    {
      name: 'Math',
      fields: [
        { name: 'formula', type: 'string' },
        { name: 'display', type: 'boolean' },
      ],
    },
  ],
};

const placeholder = (store, value) => {
  const key = `\u0000MATHCONV${store.length}\u0000`;
  store.push(value);
  return key;
};

/** Hide fenced code blocks (including their fences) from the math regexes. */
function protectFences(text, store) {
  const lines = text.split(/(?<=\n)/);
  const output = [];
  let block = null;

  for (const line of lines) {
    if (!block) {
      const match = /^(\s*)(`{3,}|~{3,})/.exec(line);
      if (match) {
        block = { char: match[2][0], length: match[2].length, lines: [line] };
      } else {
        output.push(line);
      }
      continue;
    }

    block.lines.push(line);
    const closing = new RegExp(`^\\s*${block.char}{${block.length},}\\s*$`).test(
      line.trimEnd()
    );
    if (closing) {
      output.push(placeholder(store, block.lines.join('')));
      block = null;
    }
  }

  if (block) output.push(placeholder(store, block.lines.join('')));
  return output.join('');
}

function protect(text, regex, store) {
  return text.replace(regex, (match) => placeholder(store, match));
}

/** Format a value as a JSX string attribute, or a JSON expression when needed. */
function formulaAttribute(value) {
  const formula = value.trim().replace(/\s+/g, ' ');
  if (/["&<>\n]/.test(formula)) return `{${JSON.stringify(formula)}}`;
  return `"${formula}"`;
}

function mathTag(formula, display) {
  return `<Math formula=${formulaAttribute(formula)}${
    display ? ' display={true}' : ''
  } />`;
}

/** Avoid treating `$5 and $10` as inline math. */
function looksLikeMath(formula) {
  if (all) return true;
  if (/^[\d.,\s]+$/.test(formula)) return false;
  return /\\[a-zA-Z]+|[\^_{}=+\-*/<>]/.test(formula);
}

/**
 * Convert one document's body. The frontmatter is preserved byte-for-byte;
 * code fences, inline code and existing JSX tags are restored after conversion.
 */
export function convertSource(source) {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(source);
  const head = frontmatter ? frontmatter[0] : '';
  const body = frontmatter ? source.slice(head.length) : source;
  const store = [];

  let text = protectFences(body, store);
  text = protect(text, /(`+)([\s\S]*?)\1/g, store);
  text = protect(text, /<[/A-Za-z][^>\n]*>/g, store);

  let count = 0;

  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const value = formula.trim();
    if (!value) return match;
    count += 1;
    return `\n\n${mathTag(value, true)}\n\n`;
  });

  text = text.replace(/(?<!\\)\$([^$\n]+?)\$(?!\$)/g, (match, formula) => {
    const value = formula.trim();
    if (!value || !looksLikeMath(value)) return match;
    count += 1;
    return mathTag(value, false);
  });

  const restored = text.replace(
    /\u0000MATHCONV(\d+)\u0000/g,
    (_, index) => store[Number(index)]
  );

  return { source: `${head}${restored}`, count };
}

function containsInvalidMarkdown(value) {
  const ast = parseMDX(value, MATH_FIELD, (url) => url);
  return JSON.stringify(ast).includes('invalid_markdown');
}

function collectFiles(target, files) {
  let stat;
  try {
    stat = statSync(target);
  } catch {
    console.error(`✖ Path not found: ${target}`);
    process.exitCode = 1;
    return;
  }

  if (stat.isFile()) {
    if (['.md', '.mdx'].includes(extname(target))) files.push(target);
    return;
  }

  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const full = join(target, entry.name);
    if (entry.isDirectory()) collectFiles(full, files);
    else if (['.md', '.mdx'].includes(extname(entry.name))) files.push(full);
  }
}

const files = [];
for (const target of targets) collectFiles(target, files);
if (files.length === 0) {
  console.error('✖ No .md/.mdx files found.');
  process.exit(1);
}

const changed = [];
for (const file of files) {
  const original = readFileSync(file, 'utf8');
  const converted = convertSource(original);
  if (converted.count === 0) continue;

  const body = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(converted.source)
    ? converted.source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
    : converted.source;

  if (containsInvalidMarkdown(body)) {
    checkResult(`${file} converts to valid MDX`, false, 'parseMDX returned invalid_markdown');
    continue;
  }

  changed.push({ file, count: converted.count, original, converted: converted.source });
  checkResult(`${file} converts to valid MDX`, true, `${converted.count} formula(s)`);

  if (verbose) {
    console.log(`--- ${file} ---`);
    console.log(converted.source.slice(0, 1200));
  }
}

if (write) {
  for (const item of changed) writeFileSync(item.file, item.converted, 'utf8');
}

console.log(
  `\n${changed.length} file(s), ${changed.reduce((total, item) => total + item.count, 0)} formula(s) ${
    write ? 'written' : 'found (dry run; re-run with --write)'
  }.`
);

if (check && changed.length > 0) process.exitCode = 1;
const failed = results.filter((result) => !result.passed);
if (failed.length > 0) process.exitCode = 1;
