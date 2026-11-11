/**
 * Install targets: where each agent looks for skills on disk.
 * This is the single source of truth for the install bar and /install.sh.
 * Edit the paths here if an agent changes its convention.
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
    globalDir: '~/.codex/skills',
    projectDir: '.codex/skills',
    mentionPrefix: '$',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    globalDir: '~/.cursor/skills',
    projectDir: '.cursor/skills',
    mentionPrefix: '@',
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

export function installCommand(
  origin: string,
  slug: string,
  targetId: string,
  isProject: boolean,
): string {
  const flags = [`--target ${targetId}`];
  if (isProject) flags.push('--project');
  return `curl -fsSL ${origin}/install.sh | bash -s -- ${slug} ${flags.join(' ')}`;
}
