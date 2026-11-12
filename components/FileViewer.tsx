'use client';

import {useEffect, useState} from 'react';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {StackItem} from '@astryxdesign/core/Stack';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {Selector} from '@astryxdesign/core/Selector';
import {Markdown} from '@astryxdesign/core/Markdown';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {Spinner} from '@astryxdesign/core/Spinner';
import {Banner} from '@astryxdesign/core/Banner';
import {Check, Plus} from 'lucide-react';
import type {SkillSummary} from '@/lib/skills';

/** Files are immutable per deploy, so a module-level cache is safe and makes re-opening instant. */
const cache = new Map<string, string>();

type LoadState = {status: 'loading'} | {status: 'ok'; text: string} | {status: 'error'};

const LANGUAGES: Record<string, string> = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  ts: 'ts',
  tsx: 'tsx',
  js: 'js',
  sh: 'bash',
  py: 'python',
};

function stripFrontmatter(text: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return match ? text.slice(match[0].length) : text;
}

/** Remount with a new `key` per file so state resets without effects. */
function FileBody({slug, path}: {slug: string; path: string}) {
  const url = `/skills/${slug}/raw/${path}`;
  const cached = cache.get(url);
  const [state, setState] = useState<LoadState>(
    cached !== undefined ? {status: 'ok', text: cached} : {status: 'loading'},
  );

  useEffect(() => {
    if (cache.has(url)) return;
    let cancelled = false;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(text => {
        cache.set(url, text);
        if (!cancelled) setState({status: 'ok', text});
      })
      .catch(() => {
        if (!cancelled) setState({status: 'error'});
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.status === 'loading') {
    return (
      <HStack gap={2} vAlign="center">
        <Spinner />
        <Text type="supporting">Loading {path}</Text>
      </HStack>
    );
  }
  if (state.status === 'error') {
    return <Banner status="error" title="Could not load this file" description={path} />;
  }
  if (path.toLowerCase().endsWith('.md')) {
    return (
      <Markdown headingLevelStart={3} contentWidth="100%" density="compact">
        {stripFrontmatter(state.text)}
      </Markdown>
    );
  }
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return <CodeBlock code={state.text} language={LANGUAGES[ext] ?? 'plaintext'} title={path} width="100%" />;
}

interface FileViewerProps {
  skill: SkillSummary;
  path: string;
  onPathChange: (path: string) => void;
  isSelected: boolean;
  onToggleSelected: () => void;
}

export function FileViewer({skill, path, onPathChange, isSelected, onToggleSelected}: FileViewerProps) {
  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <Heading level={2} maxLines={1}>
          {skill.name}
        </Heading>
        <HStack gap={2} vAlign="center" wrap="wrap">
          {skill.files.length > 1 ? (
            <StackItem size="fill">
              <Selector
                label="File"
                size="sm"
                variant="secondary"
                value={path}
                onChange={onPathChange}
                options={skill.files.map(f => ({value: f.path, label: f.path}))}
              />
            </StackItem>
          ) : (
            <StackItem size="fill">
              <Text type="code" color="secondary" maxLines={1}>
                {path}
              </Text>
            </StackItem>
          )}
          <Button
            label={isSelected ? `Remove ${skill.name} from install` : `Add ${skill.name} to install`}
            size="sm"
            variant={isSelected ? 'secondary' : 'primary'}
            icon={<Icon icon={isSelected ? Check : Plus} />}
            onClick={onToggleSelected}>
            {isSelected ? 'In install' : 'Add to install'}
          </Button>
          <Button label="Open full page" size="sm" variant="ghost" href={`/skills/${skill.slug}`}>
            Full page
          </Button>
        </HStack>
      </VStack>
      <FileBody key={`${skill.slug}/${path}`} slug={skill.slug} path={path} />
    </VStack>
  );
}
