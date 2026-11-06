/**
 * Import the Notion “每日一题” export into `content/posts`.
 *
 * Source is the Notion CSV (`notes/每日一题 ..._all.csv`) plus its sibling `.md`
 * files. The original notes are left untouched. Run without `--write` first:
 *
 *   node scripts/import-daily-problems.mjs
 *   node scripts/import-daily-problems.mjs --write
 *
 * The generated posts use:
 *   - title:       "20. Valid Parentheses" (number + name)
 *   - date:        2026-10-01T00:00:00.000Z (year inferred from the 2026 export)
 *   - tags:        the CSV 知识点 column
 *   - series:      每日一题
 *   - body:        <ProblemMeta review="..." difficulty="..." /> + problem link + note
 *
 * Math is converted separately with `scripts/convert-math.mjs` after generation.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const write = process.argv.includes('--write');
const force = process.argv.includes('--force');
const NOTES = 'notes';
const OUT = 'content/posts';
const CSV = join(NOTES, '每日一题 3f25e4c93a29801595d3ca33fe55c28c_all.csv');
const YEAR = 2026;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDifficulty(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'eazy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

function parseDate(value) {
  const match = /^(\d{1,2})\s+(\d{1,2})$/.exec(String(value ?? '').trim());
  if (!match) throw new Error(`Cannot parse date: ${value}`);
  const [, month, day] = match;
  return `${YEAR}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
}

function attr(value) {
  const text = String(value ?? '').trim();
  if (/["&<>\n]/.test(text)) return `{${JSON.stringify(text)}}`;
  return `"${text}"`;
}

/**
 * Notion prose frequently contains raw `<` (e.g. `1 <= n`, `m+n-1<200`).
 * MDX treats those as the start of a tag and fails the whole body. Escape
 * angle brackets only outside code, math and known JSX tags.
 */
function escapeProseAngles(text) {
  const output = [];
  const store = [];
  let fence = null;

  const token = (value) => {
    const key = `\u0000ANGLE${store.length}\u0000`;
    store.push(value);
    return key;
  };

  for (const line of text.split('\n')) {
    if (!fence) {
      const open = /^\s*(`{3,}|~{3,})/.exec(line);
      if (open) {
        fence = open[1][0];
        output.push(line);
        continue;
      }

      output.push(
        line
          .replace(/`+[^`]*`+/g, token)
          .replace(/\$[^$\n]+?\$/g, token)
          .replace(/<\/?[A-Za-z][^>\n]*>/g, token)
          .replace(/</g, '&lt;')
      );
      continue;
    }

    output.push(line);
    if (new RegExp(`^\\s*${fence}{3,}\\s*$`).test(line)) fence = null;
  }

  return output.join('\n').replace(/\u0000ANGLE(\d+)\u0000/g, (_, index) => store[Number(index)]);
}

function findMarkdown(number) {
  const prefix = `${number} `;
  const file = readdirSync(NOTES).find(
    (name) => name.endsWith('.md') && (name.startsWith(prefix) || name.startsWith(`${number}. `))
  );
  if (!file) throw new Error(`No markdown file for problem ${number}`);
  return join(NOTES, file);
}

const csvRows = parseCsv(readFileSync(CSV, 'utf8'));
const header = csvRows.shift();
const headerIndex = Object.fromEntries(header.map((label, index) => [label.trim(), index]));
for (const required of ['题目', '一句话点评', '日期', '知识点', '难度']) {
  if (!(required in headerIndex)) throw new Error(`CSV is missing column: ${required}`);
}

const items = csvRows.map((row) => {
  const title = row[headerIndex['题目']].trim();
  const match = /^(\d+)\.\s*(.+)$/.exec(title);
  return {
    title,
    number: match?.[1] ?? null,
    name: match?.[2] ?? title,
    review: row[headerIndex['一句话点评']].trim(),
    date: parseDate(row[headerIndex['日期']]),
    tags: row[headerIndex['知识点']]
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    difficulty: normalizeDifficulty(row[headerIndex['难度']]),
    row,
  };
});

function transformBody(source) {
  let lines = source.replace(/\r\n/g, '\n').split('\n');

  // Drop the Notion metadata block.
  lines = lines.filter(
    (line) => !/^(一句话点评|日期|知识点|难度)\s*[:：]/.test(line.trim())
  );

  // Drop the duplicated Notion title / bare LeetCode URL at the top, keeping
  // the first genuine URL we find as the problem link.
  let problemUrl = '';
  while (true) {
    const index = lines.findIndex((line) => line.trim());
    if (index === -1) break;
    const line = lines[index].trim();
    const linkHeading = /^#\s+\[(?:\*\*)?(.+?)(?:\*\*)?\]\((https?:\/\/[^)]+)\)$/.exec(line);
    const bareUrl = /^https?:\/\/\S+$/.exec(line);
    if (linkHeading) {
      problemUrl = linkHeading[2];
      lines.splice(index, 1);
      continue;
    }
    if (bareUrl) {
      problemUrl = line;
      lines.splice(index, 1);
      continue;
    }
    if (/^#\s+/.test(line)) {
      lines.splice(index, 1);
      continue;
    }
    break;
  }

  let body = lines.join('\n');

  body = body
    .replace(/<aside>\s*\n?([\s\S]*?)\n?<\/aside>/g, (_, inner) => {
      const content = inner
        .split('\n')
        .filter((line) => !/^\s*[\p{Extended_Pictographic}\uFE0F]+\s*$/u.test(line))
        .join('\n')
        .trim();
      // Nested `Math` inside Callout's rich-text children is parsed as raw HTML
      // by Tina. Keep the prose in a Callout and put the formula right after it.
      if (/\$[^$\n]+\$/.test(content)) {
        const [first, ...rest] = content.split(/\n{2,}/);
        return `<Callout type="info" body=${attr(first)} />\n\n${rest.join('\n\n')}`;
      }
      return `<Callout type="info">\n${content}\n</Callout>`;
    })
    .replace(
      /!\[[^\]]*\]\(0759a1cf652e6a6b73c381821fa4c826\.jpg\)/g,
      '<Figure src="/uploads/daily-problems/3863-anchor-distribution.jpg" alt="两个锚点的四种分布" />'
    )
    .replace(
      /!\[[^\]]*\]\(image\.png\)/g,
      '![正因数个数随 n 的增长](/uploads/daily-problems/3886-divisor-growth.png)'
    )
    .replace(
      /!\[[^\]]*\]\(image%201\.png\)/g,
      '![正因数个数的常见上界](/uploads/daily-problems/3886-divisor-upper-bound.png)'
    )
    .replace(
      /!\[[^\]]*\]\(https:\/\/oi-wiki\.org\/ds\/images\/seg-1\.svg\)/g,
      '![线段树区间划分示意](/uploads/daily-problems/segment-tree.svg)\n\n图源：[OI Wiki](https://oi-wiki.org/ds/seg/)（CC BY-SA）'
    )
    .replace(/^-\s*$/gm, '')
    .trim();

  body = escapeProseAngles(body);
  return { body, problemUrl };
}

const generated = [];
for (const item of items) {
  if (!item.number) {
    console.warn(`SKIP  ${item.title} — not a numbered problem`);
    continue;
  }

  const source = readFileSync(findMarkdown(item.number), 'utf8');
  const { body, problemUrl } = transformBody(source);
  const slug = `daily-${item.number}-${slugify(item.name)}`;
  const file = join(OUT, `${slug}.mdx`);

  const frontmatter = [
    '---',
    `title: ${yamlString(item.title)}`,
    `date: ${item.date}`,
    `description: ${yamlString(`LeetCode 每日一题：${item.name}`)}`,
    'tags:',
    ...item.tags.map((tag) => `  - ${yamlString(tag)}`),
    `series: ${yamlString('每日一题')}`,
    'featured: false',
    'draft: false',
    '---',
  ].join('\n');

  const parts = [
    `<ProblemMeta review=${attr(item.review)} difficulty=${attr(item.difficulty)} />`,
  ];
  if (problemUrl) parts.push(`[LeetCode 原题](${problemUrl})`);
  parts.push(body);

  generated.push({
    file,
    item,
    content: `${frontmatter}\n\n${parts.filter(Boolean).join('\n\n')}\n`,
  });
}

console.log(`Found ${items.length} CSV rows; generating ${generated.length} posts.`);
for (const entry of generated) {
  console.log(`${existsSync(entry.file) ? 'EXISTS' : 'NEW   '}  ${entry.file}`);
}

if (write) {
  for (const entry of generated) {
    if (existsSync(entry.file) && !force) {
      console.warn(`SKIP  ${entry.file} (already exists; use --force to overwrite)`);
      continue;
    }
    writeFileSync(entry.file, entry.content, 'utf8');
  }
  console.log(`\nWrote ${generated.length} posts to ${OUT}.`);
  console.log('Next: node scripts/convert-math.mjs --write content/posts');
} else {
  console.log('\nDry run only; re-run with --write to create the files.');
}
