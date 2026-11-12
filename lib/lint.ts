/**
 * Skill linter. Pure and client-safe (no fs, no gray-matter), so it runs in the browser,
 * in route handlers, and in the MCP server with identical results.
 */

export type Severity = 'error' | 'warning' | 'info';

export interface LintFinding {
  rule: string;
  severity: Severity;
  message: string;
  /** 1-based line in the original text, when the finding points at one. */
  line?: number;
}

export interface LintReport {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  findings: LintFinding[];
  stats: {lines: number; words: number; estimatedTokens: number; headings: number};
}

const PENALTY: Record<Severity, number> = {error: 25, warning: 8, info: 2};
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

interface Frontmatter {
  data: Record<string, string>;
  /** Line number where the body starts (1-based). */
  bodyStartLine: number;
  body: string;
  isClosed: boolean;
  hasBlock: boolean;
}

/** Minimal `key: value` frontmatter parser. Enough to lint; not a YAML implementation. */
function parseFrontmatter(text: string): Frontmatter {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return {data: {}, bodyStartLine: 1, body: text, isClosed: false, hasBlock: false};
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end === -1) {
    return {data: {}, bodyStartLine: 1, body: text, isClosed: false, hasBlock: true};
  }
  const data: Record<string, string> = {};
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return {
    data,
    bodyStartLine: end + 2,
    body: lines.slice(end + 1).join('\n'),
    isClosed: true,
    hasBlock: true,
  };
}

function gradeFor(score: number): LintReport['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function lintSkill(text: string, expectedSlug?: string): LintReport {
  const findings: LintFinding[] = [];
  const add = (rule: string, severity: Severity, message: string, line?: number) =>
    findings.push({rule, severity, message, line});

  const fm = parseFrontmatter(text);

  if (!fm.hasBlock) {
    add('frontmatter-missing', 'error', 'SKILL.md must start with a --- frontmatter block.', 1);
  } else if (!fm.isClosed) {
    add('frontmatter-unclosed', 'error', 'The frontmatter block is never closed with a second ---.', 1);
  }

  const name = fm.data.name;
  const description = fm.data.description;

  if (fm.isClosed) {
    if (!name) {
      add('name-missing', 'error', 'Frontmatter needs a `name`.');
    } else {
      if (!NAME_RE.test(name)) {
        add('name-format', 'error', `\`name\` should be lowercase letters, digits and hyphens: "${name}".`);
      }
      if (name.length > 64) add('name-length', 'warning', 'Keep `name` under 64 characters.');
      if (expectedSlug && name !== expectedSlug) {
        add('name-folder-mismatch', 'warning', `\`name\` is "${name}" but the folder is "${expectedSlug}". Agents match on the folder.`);
      }
    }

    if (!description) {
      add('description-missing', 'error', 'Frontmatter needs a `description`. Agents choose skills from it.');
    } else {
      if (description.length < 40) {
        add('description-short', 'warning', 'Description is very short. Say what the skill does and when to use it.');
      }
      if (description.length > 1024) {
        add('description-long', 'warning', 'Description is over 1024 characters. Agents load it for every skill, so keep it tight.');
      }
      if (/\b(todo|tbd|lorem)\b/i.test(description)) {
        add('description-placeholder', 'error', 'Description contains placeholder text.');
      }
    }
  }

  const body = fm.body;
  const bodyLines = body.split('\n');
  const headings = bodyLines.filter(l => /^#{1,6}\s+\S/.test(l));
  const words = (body.match(/\S+/g) ?? []).length;
  const estimatedTokens = Math.round(text.length / 4);

  if (words < 30) {
    add('body-thin', 'warning', 'The instructions are very short. Spell out the workflow and the expected output.');
  }
  if (estimatedTokens > 5000) {
    add('body-large', 'warning', `About ${estimatedTokens} tokens. Move reference material into a references/ file and link it.`);
  }
  if (!bodyLines.some(l => /^#\s+\S/.test(l))) {
    add('no-title', 'info', 'No top-level heading. A "# Title" helps humans skimming the file.');
  }
  if (headings.length === 0 && words > 150) {
    add('no-structure', 'warning', 'Long body with no headings. Break it into sections such as Workflow and Output.');
  }
  if (/(\/home\/[a-z0-9_-]+|\/Users\/[A-Za-z0-9_-]+|C:\\Users\\)/.test(text)) {
    add('absolute-path', 'warning', 'Contains an absolute personal path. Use paths relative to the project.');
  }
  // An api key assignment only counts when the value is a literal (quoted, or one long bare token), so
  // `apiKey = process.env.X` in a "do this instead" example is not flagged.
  if (
    /(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|api[_-]?key\s*[:=]\s*(["'][^"'\s]{12,}["']|[A-Za-z0-9_-]{16,}(?![\w.(\[])))/i.test(
      text,
    )
  ) {
    add('secret', 'error', 'Looks like it contains a credential. Remove it before publishing.');
  }

  // Unclosed code fences hide everything after them from Markdown renderers.
  const fenceLines = bodyLines
    .map((l, i) => ({l, i}))
    .filter(({l}) => /^\s*(```|~~~)/.test(l));
  if (fenceLines.length % 2 === 1) {
    add('code-fence', 'error', 'A code fence is opened but never closed.', fm.bodyStartLine + fenceLines[fenceLines.length - 1].i);
  }

  // Broken relative links to files the skill is expected to ship (e.g. references/foo.md).
  const linkRe = /\]\((?!https?:|#|mailto:)([^)\s]+)\)/g;
  for (const m of body.matchAll(linkRe)) {
    if (m[1].startsWith('/')) {
      add('absolute-link', 'info', `Link "${m[1]}" is root-relative and will not resolve inside an installed skill.`);
    }
  }

  const score = Math.max(
    0,
    100 - findings.reduce((sum, f) => sum + PENALTY[f.severity], 0),
  );

  return {
    score,
    grade: gradeFor(score),
    findings: findings.sort((a, b) => order(a.severity) - order(b.severity)),
    stats: {lines: text.split('\n').length, words, estimatedTokens, headings: headings.length},
  };
}

function order(s: Severity): number {
  return s === 'error' ? 0 : s === 'warning' ? 1 : 2;
}
