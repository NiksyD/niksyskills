'use client';

import {useCallback, useSyncExternalStore} from 'react';

const EVENT = 'niksyskills:storage';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
    window.removeEventListener(EVENT, cb);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A per-viewer preference kept in localStorage. The server render (and the first client render)
 * uses `fallback`, so there is no hydration mismatch and no setState inside an effect.
 */
export function useStoredValue<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const raw = read(key);
      return raw !== null && isValid(raw) ? raw : fallback;
    },
    () => fallback,
  );
  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage unavailable: the value still updates for this render cycle via the event below.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}

/** The page origin, for commands that must contain an absolute URL. Server render uses the env fallback. */
export function useOrigin(): string {
  const fallback = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return useSyncExternalStore(
    () => () => {},
    () => (process.env.NEXT_PUBLIC_SITE_URL ? fallback : window.location.origin),
    () => fallback,
  );
}
