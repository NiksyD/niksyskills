import type {Metadata} from 'next';
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

export default async function SkillPage({params}: PageProps<'/skills/[slug]'>) {
  const {slug} = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  return <SkillDetail skill={skill} />;
}
