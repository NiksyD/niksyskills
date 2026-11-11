import {getSkill, listSkillSlugs, toSummary} from '@/lib/skills';
import {siteOrigin} from '@/lib/site';

export function generateStaticParams() {
  return listSkillSlugs().map(slug => ({slug}));
}

export async function GET(request: Request, ctx: RouteContext<'/skills/[slug]/manifest.json'>) {
  const {slug} = await ctx.params;
  const skill = getSkill(slug);
  if (!skill) return new Response('Not found', {status: 404});
  const origin = siteOrigin(request);
  return Response.json(
    {
      ...toSummary(skill),
      url: `${origin}/skills/${skill.slug}`,
      files: skill.files.map(f => ({...f, url: `${origin}/skills/${skill.slug}/raw/${f.path}`})),
    },
    {headers: {'Cache-Control': 'public, max-age=300, s-maxage=3600'}},
  );
}
