/**
 * Install targets: where each agent looks for skills on disk.
 * This is the single source of truth for the install bar, the builder and /install.sh.
 *
 * Checked against each vendor's docs on 2026-11-12:
 * - Claude Code: ~/.claude/skills and .claude/skills
 * - Codex: ~/.agents/skills and .agents/skills (docs: learn.chatgpt.com/docs/build-skills)
 * - Cursor: ~/.cursor/skills and .cursor/skills (also reads .agents/skills)
 * - Gemini CLI: ~/.gemini/skills and .gemini/skills (also reads .agents/skills)
 * Skills are invoked by description match everywhere; the mention prefix is only a typing aid, and
 * only Claude Code (/), Codex ($) and Cursor (/) document an explicit invocation syntax.
 */
export interface InstallTarget {
  id: string;
  label: string;
  /** Directory for a user-wide install. `~` is expanded by the installer. */
  globalDir: string;
  /** Directory for a project-scoped install, relative to the project root. */
  projectDir: string;
  /** Prefix a user types to reference a skill inside this agent. */
  mentionPrefix: string;
}

export const INSTALL_TARGETS: InstallTarget[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    globalDir: '~/.claude/skills',
    projectDir: '.claude/skills',
    mentionPrefix: '/',
  },
  {
    id: 'codex',
    label: 'Codex',
    globalDir: '~/.agents/skills',
    projectDir: '.agents/skills',
    mentionPrefix: '$',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    globalDir: '~/.cursor/skills',
    projectDir: '.cursor/skills',
    mentionPrefix: '/',
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    globalDir: '~/.gemini/skills',
    projectDir: '.gemini/skills',
    mentionPrefix: '@',
  },
  {
    id: 'agents',
    label: 'Universal',
    globalDir: '~/.agents/skills',
    projectDir: '.agents/skills',
    mentionPrefix: '@',
  },
];

export const DEFAULT_TARGET_ID = 'claude';

export function getTarget(id: string): InstallTarget {
  return INSTALL_TARGETS.find(t => t.id === id) ?? INSTALL_TARGETS[0];
}

export function mentionFor(slug: string, targetId: string): string {
  return `${getTarget(targetId).mentionPrefix}${slug}`;
}

/** One command that installs one or many skills. */
export function installCommand(
  origin: string,
  slugs: string | string[],
  targetId: string,
  isProject: boolean,
  /** When the selection is exactly one bundle, pass its id for the short `--bundle` form. */
  bundleId?: string,
): string {
  const names = bundleId ? `--bundle ${bundleId}` : Array.isArray(slugs) ? slugs.join(' ') : slugs;
  const flags = [`--target ${targetId}`];
  if (isProject) flags.push('--project');
  return `curl -fsSL ${origin}/install.sh | bash -s -- ${names} ${flags.join(' ')}`;
}
