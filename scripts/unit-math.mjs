/**
 * Unit tests for the math authoring paths.
 *
 * Tina's parser does not accept bare `$...$` when the formula contains braces or
 * backslashes. These tests pin the three supported safe forms so a refactor
 * cannot quietly reintroduce the "Error parsing markdown" red box.
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/unit-math.mjs
 */
import { parseMDX } from '@tinacms/mdx';
import katex from 'katex';

const field = {
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

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const parse = (value) => parseMDX(value, field, (url) => url);
const invalid = (value) => JSON.stringify(parse(value)).includes('invalid_markdown');

check(
  'bare inline math with braces is rejected by Tina (documented limitation)',
  invalid('$e^{i\\pi}+1=0$')
);
check(
  'backtick-wrapped inline math parses',
  !invalid('行内：`$e^{i\\pi}+1=0$`。')
);
check(
  'math fenced code block parses',
  !invalid('```math\n\\frac{a，b}{c}\n```')
);
check(
  'Math component parses with a brace formula',
  !invalid('公式：<Math formula="\\frac{a，b}{c}" display={true} />')
);

for (const formula of ['e^{i\\pi}+1=0', '\\frac{a，b}{c}', '\\text{中文，标点}']) {
  try {
    const html = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    });
    check(`KaTeX renders ${formula}`, html.includes('katex'));
  } catch (error) {
    check(`KaTeX renders ${formula}`, false, error.message);
  }
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length === 0 ? 0 : 1;
