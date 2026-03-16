import { type Settings, SettingsSection, type ValueOption } from '@seerial/domain';
import { createWithEqualityFn } from 'zustand/traditional';
import { API, api } from '@/config/api';
import { defaultWebConfig } from '@/utils/defaults';

interface SettingsStore {
  clientSettings: Settings;
  serverSettings: Settings;
  settingsSection: SettingsSection;

  setSettingsSection: (section: SettingsSection) => void;
  setClientSettings: (settings: Settings) => void;
  setServerSettings: (settings: Settings) => void;

  getAllServerSettings: () => Promise<void>;
  getServerSetting: (key: string, defaultValue: ValueOption) => Promise<ValueOption>;
  setServerSetting: (key: string, value: ValueOption) => void;

  getAllClientSettings: () => void;
  getClientSetting: (key: string, defaultValue: ValueOption) => ValueOption;
  setClientSetting: (key: string, value: ValueOption) => void;
}

export const useSettingsStore = createWithEqualityFn<SettingsStore>((set) => ({
  clientSettings: defaultWebConfig,
  serverSettings: {},
  settingsSection: SettingsSection.ClientGeneral,

  setSettingsSection: (section: SettingsSection) => set(() => ({ settingsSection: section })),

  setClientSettings: (settings: Settings) => {
    localStorage.setItem('clientSettings', JSON.stringify(settings));
    set((state) => ({
      clientSettings: settings,
      serverSettings: state.serverSettings,
    }));
  },

  setServerSettings: (settings: Settings) =>
    set((state) => ({
      serverSettings: settings,
      clientSettings: state.clientSettings,
    })),

  // --- SERVER SETTINGS ---
  getAllServerSettings: async () => {
    const settings = await api.get<{ data?: Settings } | Settings>(API.servers.config);
    const result = (settings as { data?: Settings })?.data ?? (settings as Settings);
    set({ serverSettings: result ?? {} });
  },

  getServerSetting: async (key: string, defaultValue: ValueOption) => {
    const setting = await api.get<{ data?: { value?: ValueOption } } | { value?: ValueOption }>(
      API.servers.configKey(key),
    );
    const result =
      (setting as { data?: { value?: ValueOption } })?.data ?? (setting as { value?: ValueOption });
    return result ? result.value : defaultValue;
  },

  setServerSetting: async (key: string, value: ValueOption) => {
    await api.patch(API.servers.config, { [key]: value });
  },

  // --- CLIENT SETTINGS (localStorage + defaults) ---
  getAllClientSettings: () => {
    const settingsStr = localStorage.getItem('clientSettings');
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {};
    const merged = { ...defaultWebConfig, ...savedSettings };
    set({ clientSettings: merged });
  },

  getClientSetting: (key: string, defaultValue: ValueOption) => {
    const settingsStr = localStorage.getItem('clientSettings');
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {};
    const merged = { ...defaultWebConfig, ...savedSettings };
    return merged[key] ?? defaultValue;
  },

  setClientSetting: (key: string, value: ValueOption) => {
    const settingsStr = localStorage.getItem('clientSettings');
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {};
    const newSettings = { ...defaultWebConfig, ...savedSettings, [key]: value };
    localStorage.setItem('clientSettings', JSON.stringify(newSettings));
    set({ clientSettings: newSettings });
  },
}));
