import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Builder} from '@/components/Builder';
import {getAllSkills, toSummary} from '@/lib/skills';
import {getBundles} from '@/lib/registry';

export const metadata: Metadata = {
  title: 'Build your install',
  description: 'Pick only the skills you want and get one install command for them.',
};

export default function BuildPage() {
  const skills = getAllSkills().map(toSummary);
  const bundles = getBundles().map(({id, description, skills: slugs}) => ({id, description, skills: slugs}));
  // useSearchParams reads the URL at request time, so the client builder sits behind Suspense.
  return (
    <Suspense fallback={null}>
      <Builder skills={skills} bundles={bundles} />
    </Suspense>
  );
}
