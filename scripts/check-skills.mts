/**
 * Build gate: fails when any skill has a lint *error* (missing frontmatter, unclosed code fence,
 * credential-like string, ...). Warnings and info are printed but never block a deploy.
 * Runs automatically before `npm run build` via the `prebuild` script.
 */
import fs from 'node:fs';
import path from 'node:path';
import {lintSkill} from '../lib/lint.ts';
import {getBundles} from '../lib/registry.ts';

const dir = path.join(process.cwd(), 'skills');
let errors = 0;

for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
  if (!entry.isDirectory()) continue;
  const file = path.join(dir, entry.name, 'SKILL.md');
  if (!fs.existsSync(file)) {
    console.error(`x ${entry.name}: no SKILL.md`);
    errors++;
    continue;
  }
  const report = lintSkill(fs.readFileSync(file, 'utf8'), entry.name);
  for (const f of report.findings) {
    if (f.severity === 'info') continue;
    const where = f.line ? `:${f.line}` : '';
    const mark = f.severity === 'error' ? 'x' : '!';
    console.log(`${mark} ${entry.name}/SKILL.md${where} ${f.rule}: ${f.message}`);
    if (f.severity === 'error') errors++;
  }
}

// registry.json: a bundle may only list skills that exist; unbundled skills just land in "general".
const slugs = new Set(
  fs.readdirSync(dir, {withFileTypes: true}).filter(e => e.isDirectory()).map(e => e.name),
);
const bundled = new Set<string>();
for (const bundle of getBundles()) {
  for (const slug of bundle.skills) {
    bundled.add(slug);
    if (!slugs.has(slug)) {
      console.error(`x registry.json: bundle "${bundle.id}" lists "${slug}" but skills/${slug} does not exist`);
      errors++;
    }
  }
}
for (const slug of slugs) {
  if (!bundled.has(slug)) console.log(`! ${slug}: not in any registry.json bundle (shown under General)`);
}

if (errors > 0) {
  console.error(`\n${errors} skill error(s). Fix them before building.`);
  process.exit(1);
}
console.log('Skills OK');
