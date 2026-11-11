import {getAllSkills, toSummary} from '@/lib/skills';
import {siteOrigin} from '@/lib/site';

export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const skills = getAllSkills().map(skill => {
    const summary = toSummary(skill);
    return {
      ...summary,
      url: `${origin}/skills/${skill.slug}`,
      raw: `${origin}/skills/${skill.slug}/raw/SKILL.md`,
      manifest: `${origin}/skills/${skill.slug}/manifest.json`,
      install: `curl -fsSL ${origin}/install.sh | bash -s -- ${skill.slug}`,
    };
  });
  return Response.json(
    {generatedAt: new Date().toISOString(), count: skills.length, skills},
    {headers: {'Cache-Control': 'public, max-age=300, s-maxage=3600'}},
  );
}
