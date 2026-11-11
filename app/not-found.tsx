'use client';

import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Button} from '@astryxdesign/core/Button';
import {Section} from '@astryxdesign/core/Section';

export default function NotFound() {
  return (
    <Section padding={10}>
      <EmptyState
        title="Skill not found"
        description="That skill does not exist here. Check the catalog for the current list."
        actions={<Button label="Back to skills" variant="primary" href="/" />}
      />
    </Section>
  );
}
