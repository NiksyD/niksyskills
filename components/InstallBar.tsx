'use client';

import {useState} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {StackItem} from '@astryxdesign/core/Stack';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Switch} from '@astryxdesign/core/Switch';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {Token} from '@astryxdesign/core/Token';
import {Selector} from '@astryxdesign/core/Selector';
import {useToast} from '@astryxdesign/core/Toast';
import {useClipboard, useMediaQuery} from '@astryxdesign/core/hooks';
import {ExternalLink} from 'lucide-react';
import {DEFAULT_TARGET_ID, INSTALL_TARGETS, getTarget, installCommand, mentionFor} from '@/lib/targets';
import {useOrigin, useStoredValue} from '@/lib/useStoredValue';

const TARGET_KEY = 'niksyskills.target';
const isTargetId = (v: string): v is string => INSTALL_TARGETS.some(t => t.id === v);

export function InstallBar({slug}: {slug: string}) {
  const origin = useOrigin();
  const toast = useToast();
  const {copy} = useClipboard({announce: 'Copied'});
  const [targetId, selectTarget] = useStoredValue<string>(TARGET_KEY, DEFAULT_TARGET_ID, isTargetId);
  const [isProject, setIsProject] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 640px)', false);

  const target = getTarget(targetId);
  const command = installCommand(origin, slug, targetId, isProject);
  const mention = mentionFor(slug, targetId);
  const rawUrl = `${origin}/skills/${slug}/raw/SKILL.md`;
  const destination = isProject ? `./${target.projectDir}/${slug}` : `${target.globalDir}/${slug}`;

  const copyWithToast = async (text: string, what: string) => {
    const ok = await copy(text);
    toast({body: ok ? `${what} copied` : `Could not copy ${what.toLowerCase()}`, type: ok ? 'info' : 'error'});
  };

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
          <Heading level={2}>Install</Heading>
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
        </HStack>

        <CodeBlock
          code={command}
          language="bash"
          width="100%"
          isWrapped
          onCopy={() => toast({body: 'Install command copied'})}
        />

        <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
          <Text type="supporting">
            Installs to <Text type="code">{destination}</Text>
          </Text>
          <Switch label="Install into current project" value={isProject} onChange={setIsProject} />
        </HStack>

        <HStack gap={2} wrap="wrap" vAlign="center">
          <Button
            label={`Copy mention ${mention}`}
            size="sm"
            icon={<Icon icon="copy" />}
            onClick={() => void copyWithToast(mention, 'Mention')}>
            Copy mention
          </Button>
          <Token label={mention} size="sm" color="blue" />
          <StackItem size="fill">
            <Text type="supporting">Type this in {target.label} to invoke the skill.</Text>
          </StackItem>
          <Button
            label="Copy raw URL"
            size="sm"
            variant="ghost"
            icon={<Icon icon="copy" />}
            onClick={() => void copyWithToast(rawUrl, 'Raw URL')}
          />
          <Button
            label="Open raw SKILL.md"
            size="sm"
            variant="ghost"
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            endContent={<Icon icon={ExternalLink} />}>
            Raw
          </Button>
        </HStack>
      </VStack>
    </Card>
  );
}
