'use client';

import {Layout, LayoutContent, LayoutHeader, LayoutPanel} from '@astryxdesign/core/Layout';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Markdown} from '@astryxdesign/core/Markdown';
import {Outline, useOutlineFromMarkdown} from '@astryxdesign/core/Outline';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Token} from '@astryxdesign/core/Token';
import {Divider} from '@astryxdesign/core/Divider';
import {Link} from '@astryxdesign/core/Link';
import {Section} from '@astryxdesign/core/Section';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import type {Skill} from '@/lib/skills';
import {collectionLabel, formatBytes, formatDate} from '@/lib/capabilities';
import {CapabilityBadges} from './CapabilityBadges';
import {InstallBar} from './InstallBar';

export function SkillDetail({skill}: {skill: Skill}) {
  const outline = useOutlineFromMarkdown(skill.body);
  const extra = Object.entries(skill.extraFrontmatter);
  // Below tablet width the side panel would squeeze the install command; stack its details under the doc instead.
  const isNarrow = useMediaQuery('(max-width: 900px)', false);

  const details = (
    <MetadataList title="Details" columns={isNarrow ? 'multi' : 'single'}>
      <MetadataListItem label="Files">
        <VStack gap={0.5}>
          {skill.files.map(f => (
            <Link key={f.path} href={`/skills/${skill.slug}/raw/${f.path}`}>
              <Text type="code" maxLines={1}>
                {f.path}
              </Text>
            </Link>
          ))}
        </VStack>
      </MetadataListItem>
      <MetadataListItem label="Source">
        {skill.source ? (
          <VStack gap={0.5}>
            <Link href={skill.source.url}>{skill.source.name}</Link>
            <Text type="supporting" color="secondary">
              Imported · {skill.source.license}
            </Text>
          </VStack>
        ) : (
          'Original'
        )}
      </MetadataListItem>
      <MetadataListItem label="Size">{formatBytes(skill.totalBytes)}</MetadataListItem>
      <MetadataListItem label="Updated">{formatDate(skill.updatedAt)}</MetadataListItem>
      {skill.tags.length > 0 ? (
        <MetadataListItem label="Tags">
          <HStack gap={1} wrap="wrap">
            {skill.tags.map(t => (
              <Token key={t} label={t} size="sm" />
            ))}
          </HStack>
        </MetadataListItem>
      ) : null}
      {skill.history.length > 0 ? (
        <MetadataListItem label="History">
          <VStack gap={1}>
            {skill.history.slice(0, 5).map(c => (
              <VStack key={c.hash} gap={0}>
                <Text type="supporting" maxLines={2}>
                  {c.subject}
                </Text>
                <Text type="supporting" color="secondary">
                  {c.hash} · {formatDate(c.date)}
                </Text>
              </VStack>
            ))}
          </VStack>
        </MetadataListItem>
      ) : null}
      {extra.map(([key, value]) => (
        <MetadataListItem key={key} label={key}>
          <Text type="code">{typeof value === 'string' ? value : JSON.stringify(value)}</Text>
        </MetadataListItem>
      ))}
    </MetadataList>
  );

  return (
    <Layout
      height="auto"
      contentWidth={1200}
      header={
        <LayoutHeader hasDivider>
          <VStack gap={3}>
            <Breadcrumbs variant="supporting">
              <BreadcrumbItem href="/">Skills</BreadcrumbItem>
              <BreadcrumbItem>{skill.name}</BreadcrumbItem>
            </Breadcrumbs>
            <VStack gap={1}>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Heading level={1}>{skill.name}</Heading>
                <Token label={collectionLabel(skill.collection)} size="sm" color="gray" />
              </HStack>
              <Text type="large" color="secondary" as="p">
                {skill.description}
              </Text>
            </VStack>
            <CapabilityBadges ids={skill.capabilities} />
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent label="Skill documentation">
          <VStack gap={6}>
            <InstallBar slug={skill.slug} />
            <Section variant="transparent" padding={0}>
              <Markdown headingLevelStart={2} contentWidth={760}>
                {skill.body}
              </Markdown>
            </Section>
            {isNarrow ? (
              <>
                <Divider />
                {details}
              </>
            ) : null}
          </VStack>
        </LayoutContent>
      }
      end={
        isNarrow ? undefined : (
          <LayoutPanel width={280} role="complementary" label="Skill details">
            <VStack gap={4}>
              {outline.length > 0 ? (
                <VStack gap={2}>
                  <Text type="label" color="secondary">
                    On this page
                  </Text>
                  <Outline items={outline} density="compact" />
                </VStack>
              ) : null}
              <Divider />
              {details}
            </VStack>
          </LayoutPanel>
        )
      }
    />
  );
}
