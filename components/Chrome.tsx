'use client';

import {useEffect, useMemo, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {AppShell} from '@astryxdesign/core/AppShell';
import {TopNav, TopNavHeading, TopNavItem} from '@astryxdesign/core/TopNav';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {Kbd} from '@astryxdesign/core/Kbd';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {CommandPalette} from '@astryxdesign/core/CommandPalette';
import {createStaticSource} from '@astryxdesign/core/Typeahead';
import type {SearchableItem} from '@astryxdesign/core/Typeahead';
import {Sparkles, Moon, Sun, MonitorCog} from 'lucide-react';
import {useThemeMode} from '@/app/providers';
import {SITE_NAME} from '@/lib/site';
import {collectionLabel} from '@/lib/capabilities';

export interface PaletteSkill {
  slug: string;
  name: string;
  description: string;
  collection: string;
}

type PaletteItem = SearchableItem<{description: string; group: string}>;

const MODE_ICONS = {system: MonitorCog, light: Sun, dark: Moon} as const;
const MODE_NEXT = {system: 'light', light: 'dark', dark: 'system'} as const;

export function Chrome({skills, children}: {skills: PaletteSkill[]; children: React.ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const {mode, setMode} = useThemeMode();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const searchSource = useMemo(() => {
    const items: PaletteItem[] = skills.map(s => ({
      id: s.slug,
      label: s.name,
      auxiliaryData: {description: s.description, group: collectionLabel(s.collection)},
    }));
    return createStaticSource(items, {
      keywords: item => [item.id, item.auxiliaryData?.description ?? ''],
    });
  }, [skills]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ModeIcon = MODE_ICONS[mode];

  return (
    <AppShell
      height="auto"
      variant="section"
      topNav={
        <TopNav
          heading={
            <TopNavHeading
              logo={<Icon icon={Sparkles} color="accent" />}
              heading={SITE_NAME}
              headingHref="/"
            />
          }
          startContent={
            <>
              <TopNavItem label="Skills" href="/" isSelected={pathname === '/'} />
              <TopNavItem label="Build" href="/build" isSelected={pathname === '/build'} />
              <TopNavItem label="For agents" href="/#agent-access" />
            </>
          }
          endContent={
            <>
              <Button
                label="Search skills"
                variant="ghost"
                size="sm"
                icon={<Icon icon="search" />}
                endContent={<Kbd keys="mod+k" />}
                onClick={() => setIsPaletteOpen(true)}>
                Search
              </Button>
              <IconButton
                label={`Theme: ${mode}. Switch to ${MODE_NEXT[mode]}`}
                tooltip={`Theme: ${mode}`}
                variant="ghost"
                size="sm"
                icon={<Icon icon={ModeIcon} />}
                onClick={() => setMode(MODE_NEXT[mode])}
              />
            </>
          }
        />
      }>
      {children}
      <CommandPalette<PaletteItem>
        label="Search skills"
        isOpen={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        searchSource={searchSource}
        onValueChange={value => {
          setIsPaletteOpen(false);
          router.push(`/skills/${value}`);
        }}
        emptyBootstrapText="Type a skill name"
        renderItem={item => (
          <VStack gap={0.5}>
            <Text type="label">{item.label}</Text>
            <Text type="supporting" maxLines={1}>
              {item.auxiliaryData?.description ?? ''}
            </Text>
          </VStack>
        )}
      />
    </AppShell>
  );
}
