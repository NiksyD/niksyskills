import fs from 'node:fs';
import {getAllSkills, resolveSkillFile} from '@/lib/skills';

export function generateStaticParams() {
  return getAllSkills().flatMap(skill =>
    skill.files.map(f => ({slug: skill.slug, path: f.path.split('/')})),
  );
}

const TYPES: Record<string, string> = {
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
  yaml: 'text/yaml; charset=utf-8',
  yml: 'text/yaml; charset=utf-8',
  sh: 'text/x-shellscript; charset=utf-8',
  py: 'text/x-python; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  ts: 'text/plain; charset=utf-8',
};

export async function GET(_request: Request, ctx: RouteContext<'/skills/[slug]/raw/[...path]'>) {
  const {slug, path} = await ctx.params;
  const rel = path.join('/');
  const abs = resolveSkillFile(slug, rel);
  if (!abs) return new Response('Not found', {status: 404});
  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  return new Response(fs.readFileSync(abs), {
    headers: {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
