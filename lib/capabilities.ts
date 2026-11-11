/** Display config for capability badges. Client-safe. */
export interface CapabilityInfo {
  label: string;
  variant: 'green' | 'blue' | 'orange' | 'purple' | 'neutral';
  description: string;
}

export const CAPABILITIES: Record<string, CapabilityInfo> = {
  'read-only': {
    label: 'Read-only',
    variant: 'green',
    description: 'Advises only. Does not edit, stage, or commit anything.',
  },
  'uses-git': {
    label: 'Uses git',
    variant: 'blue',
    description: 'Reads git status, diffs, or history.',
  },
  'writes-files': {
    label: 'Writes files',
    variant: 'orange',
    description: 'Creates or edits files in your workspace.',
  },
  'runs-checks': {
    label: 'Runs checks',
    variant: 'purple',
    description: 'Runs tests, linters, or validation commands.',
  },
};

export function capabilityInfo(id: string): CapabilityInfo {
  return CAPABILITIES[id] ?? {label: id, variant: 'neutral', description: ''};
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
}

export function collectionLabel(id: string): string {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
