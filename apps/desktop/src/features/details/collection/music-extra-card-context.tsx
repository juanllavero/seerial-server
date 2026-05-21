import type { ReactNode } from 'react';
import { createContext, use, useState } from 'react';

interface MusicExtraCardFocusContextValue {
  focusedKey: string | null;
  setFocusedKey: (key: string | null) => void;
}

const MusicExtraCardFocusContext = createContext<MusicExtraCardFocusContextValue | null>(null);

export function MusicExtraCardFocusProvider({ children }: { children: ReactNode }) {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  return (
    <MusicExtraCardFocusContext.Provider value={{ focusedKey, setFocusedKey }}>
      {children}
    </MusicExtraCardFocusContext.Provider>
  );
}

export function useMusicExtraCardFocus() {
  const ctx = use(MusicExtraCardFocusContext);
  if (!ctx)
    throw new Error('useMusicExtraCardFocus must be used within MusicExtraCardFocusProvider');
  return ctx;
}
