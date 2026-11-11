import {getAllSkills} from '@/lib/skills';
import {SITE_NAME, SITE_TAGLINE, siteOrigin} from '@/lib/site';

export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const skills = getAllSkills();
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_TAGLINE} Each skill is a folder with a SKILL.md (YAML frontmatter + instructions).`,
    '',
    '## How to install a skill',
    '',
    `Run: curl -fsSL ${origin}/install.sh | bash -s -- <skill-name> [--target claude|codex|cursor|gemini|agents] [--project]`,
    `Or fetch the files directly: ${origin}/skills/<skill-name>/files.txt lists paths, ${origin}/skills/<skill-name>/raw/<path> serves each one.`,
    `Machine-readable index: ${origin}/skills.json`,
    '',
    '## Skills',
    '',
    ...skills.map(
      s => `- [${s.name}](${origin}/skills/${s.slug}/raw/SKILL.md): ${s.description}`,
    ),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
