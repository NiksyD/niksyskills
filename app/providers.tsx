'use client';

import Link from 'next/link';
import {createContext, useContext} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import type {ThemeMode} from '@astryxdesign/core/theme';
import {LinkProvider} from '@astryxdesign/core/Link';
import {themes, defaultThemeSlug} from '../astryx-themes';
import {useStoredValue} from '@/lib/useStoredValue';

const STORAGE_KEY = 'niksyskills.mode';
const isMode = (v: string): v is ThemeMode => v === 'system' || v === 'light' || v === 'dark';

interface ModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'system',
  setMode: () => {},
});

export function useThemeMode() {
  return useContext(ModeContext);
}

export function Providers({children}: {children: React.ReactNode}) {
  const [mode, setMode] = useStoredValue<ThemeMode>(STORAGE_KEY, 'system', isMode);

  return (
    <ModeContext.Provider value={{mode, setMode}}>
      <Theme theme={themes[defaultThemeSlug]} mode={mode}>
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </ModeContext.Provider>
  );
}
