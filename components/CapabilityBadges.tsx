'use client';

import {Badge} from '@astryxdesign/core/Badge';
import {HStack} from '@astryxdesign/core/HStack';
import {Tooltip} from '@astryxdesign/core/Tooltip';
import {capabilityInfo} from '@/lib/capabilities';

export function CapabilityBadges({ids}: {ids: string[]}) {
  if (ids.length === 0) return null;
  return (
    <HStack gap={1} wrap="wrap">
      {ids.map(id => {
        const info = capabilityInfo(id);
        return (
          <Tooltip key={id} content={info.description}>
            <Badge label={info.label} variant={info.variant} />
          </Tooltip>
        );
      })}
    </HStack>
  );
}
