import {getSkill, listSkillSlugs} from '@/lib/skills';

export function generateStaticParams() {
  return listSkillSlugs().map(slug => ({slug}));
}

/** Plain list of relative file paths, one per line. Consumed by install.sh (no jq needed). */
export async function GET(_request: Request, ctx: RouteContext<'/skills/[slug]/files.txt'>) {
  const {slug} = await ctx.params;
  const skill = getSkill(slug);
  if (!skill) return new Response('Not found', {status: 404});
  return new Response(skill.files.map(f => f.path).join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
