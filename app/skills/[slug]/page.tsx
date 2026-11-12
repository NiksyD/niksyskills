import type {Metadata} from 'next';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {SkillDetail} from '@/components/SkillDetail';
import {getSkill, listSkillSlugs} from '@/lib/skills';

/**
 * Skills are fixed at build time. Requiring the complete route to be static means an unknown slug
 * is rendered fully (and 404s) before anything is sent, instead of streaming a 200 shell.
 */
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return listSkillSlugs().map(slug => ({slug}));
}

export async function generateMetadata({params}: PageProps<'/skills/[slug]'>): Promise<Metadata> {
  const {slug} = await params;
  const skill = getSkill(slug);
  if (!skill) return {};
  return {title: skill.name, description: skill.description};
}

type Params = PageProps<'/skills/[slug]'>['params'];

/** Reads the URL param, so it lives behind Suspense and keeps the shared App Shell URL-independent. */
async function SkillContent({params}: {params: Params}) {
  const {slug} = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  return <SkillDetail skill={skill} />;
}

export default function SkillPage({params}: PageProps<'/skills/[slug]'>) {
  // No visual fallback: every real slug is prerendered, so the content resolves during the static render.
  return (
    <Suspense fallback={null}>
      <SkillContent params={params} />
    </Suspense>
  );
}
