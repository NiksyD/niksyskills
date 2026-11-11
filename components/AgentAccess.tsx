'use client';

import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {useOrigin} from '@/lib/useStoredValue';

export function AgentAccess() {
  const origin = useOrigin();
  return (
    <Card padding={6}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2} id="agent-access">
            For agents
          </Heading>
          <Text type="body" color="secondary" as="p">
            Everything on this site is also machine-readable. Paste this into any agent chat and it can
            install skills on its own.
          </Text>
        </VStack>
        <CodeBlock
          title="Prompt"
          language="markdown"
          width="100%"
          isWrapped
          code={`Install the "git-commit-message" skill from ${origin}. The index is at ${origin}/llms.txt and each skill can be installed with:\ncurl -fsSL ${origin}/install.sh | bash -s -- <skill-name>`}
        />
        <List density="compact" hasDividers edge="flush">
          <ListItem
            label={<Link href="/llms.txt">/llms.txt</Link>}
            description="Plain-text index with install instructions, for LLM discovery."
          />
          <ListItem
            label={<Link href="/skills.json">/skills.json</Link>}
            description="JSON index of every skill with raw and manifest URLs."
          />
          <ListItem
            label={<Link href="/install.sh">/install.sh</Link>}
            description="Bash installer. Supports --target, --project, --dir and multiple skills at once."
          />
          <ListItem
            label={<Text type="code">/skills/&lt;name&gt;/raw/SKILL.md</Text>}
            description="Stable raw URL for any file in a skill folder."
          />
        </List>
      </VStack>
    </Card>
  );
}
