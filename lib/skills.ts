import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import matter from 'gray-matter';
import {getPlacements, type Placement, type SkillSource} from '@/lib/registry';

/** Server-only: reads the `skills/` folder. Never import from a client component. */

export interface SkillFile {
  /** Path relative to the skill folder, POSIX separators. */
  path: string;
  bytes: number;
}

export interface SkillSummary {
  slug: string;
  name: string;
  description: string;
  /** Bundle id from registry.json; "general" when the skill is not listed in any bundle. */
  collection: string;
  /** Upstream of an imported skill, or null for your own. */
  source: SkillSource | null;
  tags: string[];
  capabilities: string[];
  files: SkillFile[];
  totalBytes: number;
  /** ISO date of the most recently modified file in the skill. */
  updatedAt: string;
}

export interface SkillCommit {
  hash: string;
  /** ISO date. */
  date: string;
  subject: string;
}

export interface Skill extends SkillSummary {
  /** Recent commits touching this skill. Empty when the skill is untracked or git history is unavailable. */
  history: SkillCommit[];
  /** SKILL.md body with frontmatter stripped. */
  body: string;
  /** Raw SKILL.md including frontmatter. */
  raw: string;
  /** Frontmatter keys other than name/description, for display. */
  extraFrontmatter: Record<string, unknown>;
}

export const SKILLS_DIR = path.join(process.cwd(), 'skills');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length <= 64;
}

function walk(dir: string, base: string): SkillFile[] {
  const out: SkillFile[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(abs, base));
    } else if (entry.isFile()) {
      const rel = path.relative(base, abs).split(path.sep).join('/');
      out.push({path: rel, bytes: fs.statSync(abs).size});
    }
  }
  return out.sort((a, b) =>
    a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : a.path.localeCompare(b.path),
  );
}

function latestMtime(dir: string): Date {
  let latest = fs.statSync(dir).mtime;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const abs = path.join(dir, entry.name);
    const m = entry.isDirectory() ? latestMtime(abs) : fs.statSync(abs).mtime;
    if (m > latest) latest = m;
  }
  return latest;
}

const CAPABILITY_RULES: Array<{id: string; test: RegExp}> = [
  {
    id: 'read-only',
    test: /advisory only|never run `git add`|do not edit files|without changing files|read-only|does not modify/i,
  },
  {id: 'uses-git', test: /\bgit (status|diff|log|add|commit|push|branch)\b/i},
  {id: 'writes-files', test: /create or overwrite|writes? (a |the )?`?[A-Z_]+\.md`?|edit files|modif(y|ies) files/i},
  {id: 'runs-checks', test: /\b(lint|test|type-?check|validation) (pass|run|suite)|run (the )?(tests|linter)/i},
];

function deriveCapabilities(body: string, explicit?: unknown): string[] {
  if (Array.isArray(explicit)) return explicit.map(String);
  const caps = CAPABILITY_RULES.filter(r => r.test.test(body)).map(r => r.id);
  // A skill that declares itself read-only does not also "write files".
  return caps.includes('read-only') ? caps.filter(c => c !== 'writes-files') : caps;
}

/** Last commits for one skill folder. Never throws: shallow clones and untracked files give []. */
function readHistory(slug: string): SkillCommit[] {
  try {
    const out = execFileSync(
      'git',
      ['log', '-n', '15', '--format=%h%x09%cI%x09%s', '--', `skills/${slug}`],
      {cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
    );
    return out
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, date, ...rest] = line.split('\t');
        return {hash, date, subject: rest.join('\t')};
      });
  } catch {
    return [];
  }
}

function readSkill(slug: string, placements: Map<string, Placement>): Skill | null {
  const placement = placements.get(slug);
  const collection = placement?.collection ?? 'general';
  const dir = path.join(SKILLS_DIR, slug);
  const skillFile = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;
  const raw = fs.readFileSync(skillFile, 'utf8');
  const parsed = matter(raw);
  const {name, description, tags, capabilities, collection: fmCollection, ...rest} = parsed.data as Record<
    string,
    unknown
  >;
  const files = walk(dir, dir);
  const history = readHistory(slug);
  return {
    history,
    slug,
    name: typeof name === 'string' && name ? name : slug,
    description: typeof description === 'string' ? description : '',
    collection: typeof fmCollection === 'string' ? fmCollection : collection,
    source: placement?.source ?? null,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    capabilities: deriveCapabilities(parsed.content, capabilities),
    files,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    // Commit date is stable across checkouts; file mtimes are not. Fall back for untracked skills.
    updatedAt: history[0]?.date ?? latestMtime(dir).toISOString(),
    body: parsed.content.trim(),
    raw,
    extraFrontmatter: rest,
  };
}

export function listSkillSlugs(): string[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, {withFileTypes: true})
    .filter(e => e.isDirectory() && isValidSlug(e.name))
    .filter(e => fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')))
    .map(e => e.name)
    .sort();
}

export function getAllSkills(): Skill[] {
  const placements = getPlacements();
  return listSkillSlugs()
    .map(slug => readSkill(slug, placements))
    .filter((s): s is Skill => s !== null);
}

export function getSkill(slug: string): Skill | null {
  if (!isValidSlug(slug)) return null;
  return readSkill(slug, getPlacements());
}

export function toSummary(skill: Skill): SkillSummary {
  const {slug, name, description, collection, source, tags, capabilities, files, totalBytes, updatedAt} = skill;
  return {slug, name, description, collection, source, tags, capabilities, files, totalBytes, updatedAt};
}

/** Resolve a file inside a skill folder, refusing anything outside it. */
export function resolveSkillFile(slug: string, relPath: string): string | null {
  if (!isValidSlug(slug)) return null;
  const dir = path.join(SKILLS_DIR, slug);
  const abs = path.resolve(dir, relPath);
  if (abs !== dir && !abs.startsWith(dir + path.sep)) return null;
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
  return abs;
}
