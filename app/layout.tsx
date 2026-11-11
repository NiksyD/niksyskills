import type {Metadata} from 'next';
import './globals.css';
import {Providers} from './providers';
import {Chrome} from '@/components/Chrome';
import {getAllSkills} from '@/lib/skills';
import {SITE_NAME, SITE_TAGLINE} from '@/lib/site';

export const metadata: Metadata = {
  title: {default: SITE_NAME, template: `%s · ${SITE_NAME}`},
  description: SITE_TAGLINE,
};

export default function RootLayout({children}: LayoutProps<'/'>) {
  const paletteSkills = getAllSkills().map(({slug, name, description, collection}) => ({
    slug,
    name,
    description,
    collection,
  }));
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Chrome skills={paletteSkills}>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
