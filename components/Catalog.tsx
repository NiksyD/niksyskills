'use client';

import {useDeferredValue, useMemo, useState} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Grid} from '@astryxdesign/core/Grid';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {StackItem} from '@astryxdesign/core/Stack';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Button} from '@astryxdesign/core/Button';
import {Token} from '@astryxdesign/core/Token';
import {Icon} from '@astryxdesign/core/Icon';
import {SearchX} from 'lucide-react';
import type {SkillSummary} from '@/lib/skills';
import {collectionLabel, formatDate} from '@/lib/capabilities';
import {CapabilityBadges} from './CapabilityBadges';
import {AgentAccess} from './AgentAccess';
import {SITE_TAGLINE} from '@/lib/site';

export function Catalog({skills}: {skills: SkillSummary[]}) {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('all');
  const deferredQuery = useDeferredValue(query);

  // One option per bundle with its skill count, so the filter stays usable as bundles are added.
  const collectionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of skills) counts.set(s.collection, (counts.get(s.collection) ?? 0) + 1);
    return [
      {value: 'all', label: `All skills (${skills.length})`},
      ...Array.from(counts.keys())
        .sort((a, b) => collectionLabel(a).localeCompare(collectionLabel(b)))
        .map(c => ({value: c, label: `${collectionLabel(c)} (${counts.get(c)})`})),
    ];
  }, [skills]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return skills.filter(s => {
      if (collection !== 'all' && s.collection !== collection) return false;
      if (!q) return true;
      return (
        s.slug.includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [skills, deferredQuery, collection]);

  return (
    <Layout
      height="auto"
      contentWidth={1200}
      header={
        <LayoutHeader>
          <VStack gap={2}>
            <Heading level={1} type="display-3">
              Skills
            </Heading>
            <Text type="large" color="secondary" as="p">
              {SITE_TAGLINE} Pick one, copy the command, paste it in a terminal.
            </Text>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent>
          <VStack gap={8}>
            <VStack gap={4}>
              <HStack gap={3} vAlign="center" wrap="wrap">
                <StackItem size="fill">
                  <TextInput
                    type="search"
                    label="Search skills"
                    isLabelHidden
                    placeholder="Search by name, description, or tag"
                    startIcon="search"
                    hasClear
                    value={query}
                    onChange={setQuery}
                    enterKeyHint="search"
                    width="100%"
                  />
                </StackItem>
                {collectionOptions.length > 2 ? (
                  <Selector
                    label="Bundle"
                    isLabelHidden
                    startIcon="filter"
                    options={collectionOptions}
                    value={collection}
                    onChange={setCollection}
                    hasSearch
                    searchPlaceholder="Find a bundle"
                    presentation="adaptive"
                    width={240}
                  />
                ) : null}
              </HStack>

              {visible.length === 0 ? (
                <EmptyState
                  title="No skills match"
                  description="Try a different search term or clear the collection filter."
                  icon={<Icon icon={SearchX} size="lg" color="secondary" />}
                  actions={
                    <Button
                      label="Clear filters"
                      onClick={() => {
                        setQuery('');
                        setCollection('all');
                      }}
                    />
                  }
                />
              ) : (
                <Grid columns={{minWidth: 300, max: 3}} gap={4}>
                  {visible.map(skill => (
                    <ClickableCard
                      key={skill.slug}
                      label={`Open ${skill.name}`}
                      href={`/skills/${skill.slug}`}
                      elevation="low">
                      <VStack gap={3} height="100%">
                        <VStack gap={1}>
                          <HStack gap={2} vAlign="center" hAlign="between">
                            <Heading level={3} maxLines={1}>
                              {skill.name}
                            </Heading>
                            <Token label={collectionLabel(skill.collection)} size="sm" color="gray" />
                          </HStack>
                          <Text type="code" color="secondary" maxLines={1}>
                            /{skill.slug}
                          </Text>
                        </VStack>
                        <StackItem size="fill">
                          <Text type="body" color="secondary" as="p" maxLines={3}>
                            {skill.description}
                          </Text>
                        </StackItem>
                        <CapabilityBadges ids={skill.capabilities} />
                        <Text type="supporting">
                          {skill.files.length} {skill.files.length === 1 ? 'file' : 'files'} · updated{' '}
                          {formatDate(skill.updatedAt)}
                        </Text>
                      </VStack>
                    </ClickableCard>
                  ))}
                </Grid>
              )}
            </VStack>

            <AgentAccess />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
