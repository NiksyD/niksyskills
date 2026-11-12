'use client';

import {useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Layout, LayoutContent, LayoutHeader, LayoutPanel} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {StackItem} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Selector} from '@astryxdesign/core/Selector';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Switch} from '@astryxdesign/core/Switch';
import {Divider} from '@astryxdesign/core/Divider';
import {Drawer, DrawerHeader} from '@astryxdesign/core/Drawer';
import {TreeList} from '@astryxdesign/core/TreeList';
import type {TreeListItemData} from '@astryxdesign/core/TreeList';
import {useToast} from '@astryxdesign/core/Toast';
import {useClipboard, useMediaQuery} from '@astryxdesign/core/hooks';
import {ChevronsDownUp, ChevronsUpDown, Eye, FileText, Folder, MousePointerClick, PackageOpen} from 'lucide-react';
import type {SkillSummary} from '@/lib/skills';
import {DEFAULT_TARGET_ID, INSTALL_TARGETS, getTarget, installCommand, mentionFor} from '@/lib/targets';
import {collectionLabel, formatBytes} from '@/lib/capabilities';
import {useOrigin, useStoredValue} from '@/lib/useStoredValue';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {FileViewer} from './FileViewer';

const TARGET_KEY = 'niksyskills.target';
const isTargetId = (v: string): v is string => INSTALL_TARGETS.some(t => t.id === v);

/** Merge a patch into the current query string without a navigation. Next.js syncs useSearchParams. */
function updateUrl(patch: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

interface TreeNode {
  name: string;
  path: string;
  /** Skill slug and in-skill file path, set for files only. */
  slug?: string;
  rel?: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function buildTree(
  rootPath: string,
  skills: SkillSummary[],
  viewKey: string | null,
  onOpen: (slug: string, rel: string) => void,
  expanded: boolean,
): TreeListItemData[] {
  const root: TreeNode = {name: '', path: rootPath, children: new Map(), isFile: false};
  for (const skill of skills) {
    for (const file of skill.files) {
      let node = root;
      const parts = [skill.slug, ...file.path.split('/')];
      parts.forEach((part, i) => {
        const isFile = i === parts.length - 1;
        let child = node.children.get(part);
        if (!child) {
          child = {
            name: part,
            path: `${node.path}/${part}`,
            children: new Map(),
            isFile,
            ...(isFile ? {slug: skill.slug, rel: file.path} : {}),
          };
          node.children.set(part, child);
        }
        node = child;
      });
    }
  }
  const toItem = (node: TreeNode): TreeListItemData => {
    if (node.isFile && node.slug && node.rel) {
      const {slug, rel} = node;
      return {
        id: node.path,
        label: <Text maxLines={1}>{node.name}</Text>,
        startContent: <Icon icon={FileText} size="xsm" />,
        isSelected: viewKey === `${slug}/${rel}`,
        onClick: () => onOpen(slug, rel),
      };
    }
    return {
      id: node.path,
      label: <Text maxLines={1}>{node.name}</Text>,
      startContent: <Icon icon={Folder} size="xsm" />,
      isExpanded: expanded,
      children: Array.from(node.children.values()).map(toItem),
    };
  };
  return Array.from(root.children.values()).map(toItem);
}

export interface BundleInfo {
  id: string;
  description: string;
  skills: string[];
}

export function Builder({skills, bundles}: {skills: SkillSummary[]; bundles: BundleInfo[]}) {
  const params = useSearchParams();
  const [treeExpanded, setTreeExpanded] = useState(false);
  // Groups the user opened or closed by hand. Anything not listed opens on its own when it already
  // holds a picked skill, so a selection is never hidden behind a closed row.
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});
  const origin = useOrigin();
  const toast = useToast();
  const {copy} = useClipboard({announce: 'Copied'});
  const isNarrow = useMediaQuery('(max-width: 900px)', false);
  // Three columns need room for the picker, the output and a readable viewer.
  const isWide = useMediaQuery('(min-width: 1500px)', false);
  const [storedTarget, setStoredTarget] = useStoredValue<string>(TARGET_KEY, DEFAULT_TARGET_ID, isTargetId);

  const targetParam = params.get('t');
  const targetId = targetParam && isTargetId(targetParam) ? targetParam : storedTarget;
  const isProject = params.get('p') === '1';
  const target = getTarget(targetId);

  const selectedSlugs = useMemo(() => {
    const wanted = new Set((params.get('s') ?? '').split(',').filter(Boolean));
    // Catalog order keeps the generated command stable no matter how the link was written.
    return skills.filter(s => wanted.has(s.slug)).map(s => s.slug);
  }, [params, skills]);
  const selected = useMemo(() => skills.filter(s => selectedSlugs.includes(s.slug)), [skills, selectedSlugs]);

  // The viewer target comes from ?v=<slug>/<file> and must name a real file, so a stale link falls back to empty.
  const viewParam = params.get('v');
  const view = useMemo(() => {
    if (!viewParam) return null;
    const slash = viewParam.indexOf('/');
    if (slash < 1) return null;
    const slug = viewParam.slice(0, slash);
    const path = viewParam.slice(slash + 1);
    const skill = skills.find(s => s.slug === slug);
    return skill && skill.files.some(f => f.path === path) ? {skill, path} : null;
  }, [viewParam, skills]);
  const viewKey = view ? `${view.skill.slug}/${view.path}` : null;

  // Picker sections follow registry.json order; skills in no bundle land in a trailing "general" group.
  const groups = useMemo(() => {
    const bySlug = new Map(skills.map(s => [s.slug, s]));
    const placed = new Set<string>();
    const out = bundles.map(b => {
      const members = b.skills.flatMap(slug => {
        const skill = bySlug.get(slug);
        return skill && !placed.has(slug) ? [skill] : [];
      });
      members.forEach(s => placed.add(s.slug));
      return {id: b.id, description: b.description, members};
    });
    const rest = skills.filter(s => !placed.has(s.slug));
    if (rest.length > 0) out.push({id: 'general', description: 'Skills not in any bundle.', members: rest});
    return out.filter(g => g.members.length > 0);
  }, [skills, bundles]);

  /** The bundle whose skills are exactly the selection, so the command can use the short --bundle form. */
  const exactBundle = useMemo(
    () =>
      bundles.find(
        b => b.skills.length === selectedSlugs.length && b.skills.every(slug => selectedSlugs.includes(slug)),
      ),
    [bundles, selectedSlugs],
  );

  const setSelection = (slugs: string[]) => updateUrl({s: slugs.length > 0 ? slugs.join(',') : null});
  const toggle = (slug: string, on: boolean) =>
    setSelection(on ? [...selectedSlugs, slug] : selectedSlugs.filter(s => s !== slug));
  const addAll = (slugs: string[]) => setSelection(Array.from(new Set([...selectedSlugs, ...slugs])));
  const selectTarget = (id: string) => {
    setStoredTarget(id);
    updateUrl({t: id});
  };
  const openFile = (slug: string, path: string) => updateUrl({v: `${slug}/${path}`});
  const closeViewer = () => updateUrl({v: null});

  const rootDir = isProject ? `./${target.projectDir}` : target.globalDir;
  const tree = useMemo(
    () => buildTree(rootDir, selected, viewKey, openFile, treeExpanded),
    [rootDir, selected, viewKey, treeExpanded],
  );
  const fileCount = selected.reduce((n, s) => n + s.files.length, 0);
  const totalBytes = selected.reduce((n, s) => n + s.totalBytes, 0);
  const command = installCommand(origin, selectedSlugs, targetId, isProject, exactBundle?.id);
  const mentions = selectedSlugs.map(s => mentionFor(s, targetId)).join(' ');
  const shareLink = `${origin}/build?${new URLSearchParams({
    s: selectedSlugs.join(','),
    t: targetId,
    ...(isProject ? {p: '1'} : {}),
    ...(viewKey ? {v: viewKey} : {}),
  }).toString()}`;

  const copyWithToast = async (value: string, what: string) => {
    const ok = await copy(value);
    toast({body: ok ? `${what} copied` : `Could not copy ${what.toLowerCase()}`, type: ok ? 'info' : 'error'});
  };

  const picker = (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>Skills</Heading>
        <Text type="supporting">
          {selectedSlugs.length} of {skills.length} selected. Use the eye to read a skill first.
        </Text>
      </VStack>
      <HStack gap={2} wrap="wrap">
        <Button label="Select all" size="sm" onClick={() => setSelection(skills.map(s => s.slug))} />
        <Button label="Clear" size="sm" variant="ghost" onClick={() => setSelection([])} />
      </HStack>
      <Divider />
      <VStack gap={4}>
        {groups.map(group => {
          const slugs = group.members.map(s => s.slug);
          const pickedCount = slugs.filter(s => selectedSlugs.includes(s)).length;
          const allPicked = pickedCount === slugs.length;
          return (
            <HStack key={group.id} gap={2} vAlign="start">
              <StackItem size="fill">
                <Collapsible
                  isOpen={openOverride[group.id] ?? pickedCount > 0}
                  onOpenChange={open => setOpenOverride(prev => ({...prev, [group.id]: open}))}
                  chevronPosition="start"
                  trigger={
                    <HStack gap={2} vAlign="center">
                      <Text type="label">{collectionLabel(group.id)}</Text>
                      <Text type="supporting" color="secondary">
                        {pickedCount}/{slugs.length}
                      </Text>
                    </HStack>
                  }>
                  <VStack gap={3}>
                    <Text type="supporting" color="secondary">
                      {group.description}
                    </Text>
                    {group.members.map(skill => (
                      <HStack key={skill.slug} gap={1} vAlign="start">
                        <StackItem size="fill">
                          <CheckboxInput
                            label={skill.name}
                            description={
                              skill.description.length > 110
                                ? `${skill.description.slice(0, 107)}...`
                                : skill.description
                            }
                            value={selectedSlugs.includes(skill.slug)}
                            onChange={on => toggle(skill.slug, on)}
                          />
                        </StackItem>
                        <IconButton
                          label={`Preview ${skill.name}`}
                          tooltip="Preview"
                          size="sm"
                          variant={view?.skill.slug === skill.slug ? 'secondary' : 'ghost'}
                          icon={<Icon icon={Eye} />}
                          onClick={() => openFile(skill.slug, 'SKILL.md')}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Collapsible>
              </StackItem>
              {/* Beside the trigger, not inside it, so one click adds a bundle without opening it. */}
              <div style={{flexShrink: 0}}>
                <Button
                  label={allPicked ? 'Remove' : 'Add all'}
                  size="sm"
                  variant={allPicked ? 'ghost' : 'secondary'}
                  onClick={() =>
                    allPicked ? setSelection(selectedSlugs.filter(s => !slugs.includes(s))) : addAll(slugs)
                  }
                />
              </div>
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );

  const output = (
    <VStack gap={5} maxWidth={820}>
      <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        {isNarrow ? (
          <Selector
            label="Agent"
            size="sm"
            variant="secondary"
            value={targetId}
            onChange={selectTarget}
            options={INSTALL_TARGETS.map(t => ({value: t.id, label: t.label}))}
          />
        ) : (
          <SegmentedControl label="Agent" value={targetId} onChange={selectTarget} size="sm">
            {INSTALL_TARGETS.map(t => (
              <SegmentedControlItem key={t.id} value={t.id} label={t.label} />
            ))}
          </SegmentedControl>
        )}
        <Switch
          label="Install into current project"
          value={isProject}
          onChange={on => updateUrl({p: on ? '1' : null})}
        />
      </HStack>

      {selected.length === 0 ? (
        <EmptyState
          title="Pick the skills you want"
          description="Only the skills you tick are installed. The folder preview and command update as you choose."
          icon={<Icon icon={PackageOpen} size="lg" color="secondary" />}
        />
      ) : (
        <>
          <Card padding={4}>
            <VStack gap={3}>
              <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
                <Heading level={3}>What gets created</Heading>
                <HStack gap={2} vAlign="center">
                  <Text type="supporting">
                    {selected.length} {selected.length === 1 ? 'skill' : 'skills'} · {fileCount}{' '}
                    {fileCount === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)}
                  </Text>
                  <Button
                    label={treeExpanded ? 'Collapse all folders' : 'Expand all folders'}
                    size="sm"
                    variant="ghost"
                    icon={<Icon icon={treeExpanded ? ChevronsDownUp : ChevronsUpDown} />}
                    onClick={() => setTreeExpanded(!treeExpanded)}>
                    {treeExpanded ? 'Collapse all' : 'Expand all'}
                  </Button>
                </HStack>
              </HStack>
              <Text type="code" color="secondary">
                {rootDir}
              </Text>
              {/* TreeList owns its expansion state, so a new key re-applies isExpanded to every folder. */}
              <TreeList
                key={`${rootDir}|${selectedSlugs.join(',')}|${treeExpanded}`}
                items={tree}
                density="compact"
              />
              <Text type="supporting">Select a file to read it.</Text>
            </VStack>
          </Card>

          <VStack gap={3}>
            <Heading level={3}>Install command</Heading>
            <CodeBlock
              code={command}
              language="bash"
              width="100%"
              isWrapped
              onCopy={() => toast({body: 'Install command copied'})}
            />
            <HStack gap={2} wrap="wrap" vAlign="center">
              <Button
                label="Copy mentions"
                size="sm"
                icon={<Icon icon="copy" />}
                onClick={() => void copyWithToast(mentions, 'Mentions')}>
                Copy mentions
              </Button>
              <Button
                label="Copy share link"
                size="sm"
                variant="secondary"
                icon={<Icon icon="copy" />}
                onClick={() => void copyWithToast(shareLink, 'Share link')}>
                Copy share link
              </Button>
              <StackItem size="fill">
                <Text type="code" color="secondary" maxLines={1}>
                  {mentions}
                </Text>
              </StackItem>
            </HStack>
          </VStack>
        </>
      )}
    </VStack>
  );

  const viewer = view ? (
    <FileViewer
      skill={view.skill}
      path={view.path}
      onPathChange={path => openFile(view.skill.slug, path)}
      isSelected={selectedSlugs.includes(view.skill.slug)}
      onToggleSelected={() => toggle(view.skill.slug, !selectedSlugs.includes(view.skill.slug))}
    />
  ) : (
    <EmptyState
      title="Nothing open"
      description="Click the eye next to a skill, or a file in the folder preview, to read it here."
      icon={<Icon icon={MousePointerClick} size="lg" color="secondary" />}
      isCompact
    />
  );

  return (
    <>
      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider>
            <VStack gap={1}>
              <Heading level={1} type="display-3">
                Build your install
              </Heading>
              <Text type="large" color="secondary" as="p">
                Choose only the skills you want and get one command that installs just those.
              </Text>
            </VStack>
          </LayoutHeader>
        }
        start={
          isNarrow ? undefined : (
            <LayoutPanel width={340} hasDivider role="complementary" label="Skill picker">
              {picker}
            </LayoutPanel>
          )
        }
        content={
          <LayoutContent label="Install builder">
            <VStack gap={6}>
              {isNarrow ? picker : null}
              {output}
            </VStack>
          </LayoutContent>
        }
        end={
          isWide ? (
            <LayoutPanel width={520} hasDivider role="complementary" label="File preview">
              {viewer}
            </LayoutPanel>
          ) : undefined
        }
      />
      {/* Below the wide breakpoint the viewer slides over the page instead of squeezing the other columns. */}
      <Drawer
        isOpen={!isWide && view !== null}
        onOpenChange={open => {
          if (!open) closeViewer();
        }}
        label="File preview"
        width={560}>
        <Layout
          header={<DrawerHeader title="File preview" onOpenChange={open => !open && closeViewer()} />}
          content={<LayoutContent>{viewer}</LayoutContent>}
        />
      </Drawer>
    </>
  );
}
