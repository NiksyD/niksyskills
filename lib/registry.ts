import fs from 'node:fs';
import path from 'node:path';

/** Server-only: reads `registry.json`, the explicit grouping of skills into bundles. */

export interface SkillSource {
  name: string;
  url: string;
  license: string;
}

export interface Bundle {
  id: string;
  description: string;
  /** Present for bundles imported from someone else; absent for your own skills. */
  source: SkillSource | null;
  skills: string[];
}

export const REGISTRY_FILE = path.join(process.cwd(), 'registry.json');

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function parseSource(value: unknown): SkillSource | null {
  if (!value || typeof value !== 'object') return null;
  const {name, url, license} = value as Record<string, unknown>;
  return isString(name) && isString(url) && isString(license) ? {name, url, license} : null;
}

/** Never throws: a missing or malformed registry just means no bundles. */
export function getBundles(): Bundle[] {
  try {
    const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) as {bundles?: unknown};
    if (!Array.isArray(data.bundles)) return [];
    return data.bundles.flatMap((b): Bundle[] => {
      const {id, description, source, skills} = (b ?? {}) as Record<string, unknown>;
      if (!isString(id) || !Array.isArray(skills)) return [];
      return [
        {
          id,
          description: typeof description === 'string' ? description : '',
          source: parseSource(source),
          skills: skills.filter(isString),
        },
      ];
    });
  } catch {
    return [];
  }
}

export interface Placement {
  collection: string;
  source: SkillSource | null;
}

/** slug -> bundle id and source. A skill listed in two bundles belongs to the first. */
export function getPlacements(): Map<string, Placement> {
  const placements = new Map<string, Placement>();
  for (const bundle of getBundles()) {
    for (const slug of bundle.skills) {
      if (!placements.has(slug)) placements.set(slug, {collection: bundle.id, source: bundle.source});
    }
  }
  return placements;
}
