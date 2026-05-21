import type { ReactNode } from 'react';
import { createContext, use, useState } from 'react';

interface SettingsPanelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SettingsPanelContext = createContext<SettingsPanelContextValue | null>(null);

export function SettingsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SettingsPanelContext.Provider value={{ open, setOpen }}>
      {children}
    </SettingsPanelContext.Provider>
  );
}

export function useSettingsPanel() {
  const ctx = use(SettingsPanelContext);
  if (!ctx) throw new Error('useSettingsPanel must be used within SettingsPanelProvider');
  return ctx;
}
