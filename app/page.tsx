import {Catalog} from '@/components/Catalog';
import {getAllSkills, toSummary} from '@/lib/skills';

export default function Home() {
  const skills = getAllSkills().map(toSummary);
  return <Catalog skills={skills} />;
}
