import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

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
  collection: string;
  tags: string[];
  capabilities: string[];
  files: SkillFile[];
  totalBytes: number;
  /** ISO date of the most recently modified file in the skill. */
  updatedAt: string;
}

export interface Skill extends SkillSummary {
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

function deriveCollections(slugs: string[]): Map<string, string> {
  // Longest hyphen-prefix shared by at least two skills becomes the collection.
  const result = new Map<string, string>();
  for (const slug of slugs) {
    const parts = slug.split('-');
    let best = '';
    for (let k = parts.length - 1; k >= 1; k--) {
      const prefix = parts.slice(0, k).join('-');
      const shared = slugs.filter(s => s === prefix || s.startsWith(prefix + '-')).length;
      if (shared >= 2) {
        best = prefix;
        break;
      }
    }
    result.set(slug, best || 'general');
  }
  return result;
}

function readSkill(slug: string, collection: string): Skill | null {
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
  return {
    slug,
    name: typeof name === 'string' && name ? name : slug,
    description: typeof description === 'string' ? description : '',
    collection: typeof fmCollection === 'string' ? fmCollection : collection,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    capabilities: deriveCapabilities(parsed.content, capabilities),
    files,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    updatedAt: latestMtime(dir).toISOString(),
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
  const slugs = listSkillSlugs();
  const collections = deriveCollections(slugs);
  return slugs
    .map(slug => readSkill(slug, collections.get(slug) ?? 'general'))
    .filter((s): s is Skill => s !== null);
}

export function getSkill(slug: string): Skill | null {
  if (!isValidSlug(slug)) return null;
  const collections = deriveCollections(listSkillSlugs());
  return readSkill(slug, collections.get(slug) ?? 'general');
}

export function toSummary(skill: Skill): SkillSummary {
  const {slug, name, description, collection, tags, capabilities, files, totalBytes, updatedAt} = skill;
  return {slug, name, description, collection, tags, capabilities, files, totalBytes, updatedAt};
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
