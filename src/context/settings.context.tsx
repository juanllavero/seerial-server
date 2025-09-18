import { Settings, SettingsSection, ValueOption } from '@/data/interfaces/Utils'
import { authenticatedFetch } from '@/lib/auth'
import { defaultWebConfig } from '@/utils/defaults'
import { createWithEqualityFn } from 'zustand/traditional'

interface SettingsStore {
  clientSettings: Settings
  serverSettings: Settings
  settingsSection: SettingsSection

  setSettingsSection: (section: SettingsSection) => void
  setClientSettings: (settings: Settings) => void
  setServerSettings: (settings: Settings) => void

  getAllServerSettings: (serverUrl: string) => Promise<void>
  getServerSetting: (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => Promise<ValueOption>
  setServerSetting: (serverUrl: string, key: string, value: ValueOption) => void

  getAllClientSettings: () => void
  getClientSetting: (key: string, defaultValue: ValueOption) => ValueOption
  setClientSetting: (key: string, value: ValueOption) => void
}

export const useSettingsStore = createWithEqualityFn<SettingsStore>((set) => ({
  clientSettings: defaultWebConfig,
  serverSettings: {},
  settingsSection: SettingsSection.ClientGeneral,

  setSettingsSection: (section: SettingsSection) =>
    set(() => ({ settingsSection: section })),

  setClientSettings: (settings: Settings) => {
    localStorage.setItem('clientSettings', JSON.stringify(settings))
    set((state) => ({
      clientSettings: settings,
      serverSettings: state.serverSettings,
    }))
  },

  setServerSettings: (settings: Settings) =>
    set((state) => ({
      serverSettings: settings,
      clientSettings: state.clientSettings,
    })),

  // --- SERVER SETTINGS ---
  getAllServerSettings: async (serverUrl: string) => {
    const settings = await authenticatedFetch(`${serverUrl}/serverConfig`)
    const result = await settings.json()
    set({ serverSettings: result })
  },

  getServerSetting: async (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => {
    const setting = await authenticatedFetch(`${serverUrl}/serverConfig/${key}`)
    const result = await setting.json()
    return result ? result.value : defaultValue
  },

  setServerSetting: async (
    serverUrl: string,
    key: string,
    value: ValueOption,
  ) => {
    authenticatedFetch(`${serverUrl}/serverConfig`, 'PATCH', { [key]: value })
  },

  // --- CLIENT SETTINGS (localStorage + defaults) ---
  getAllClientSettings: () => {
    const settingsStr = localStorage.getItem('clientSettings')
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {}
    const merged = { ...defaultWebConfig, ...savedSettings }
    set({ clientSettings: merged })
  },

  getClientSetting: (key: string, defaultValue: ValueOption) => {
    const settingsStr = localStorage.getItem('clientSettings')
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {}
    const merged = { ...defaultWebConfig, ...savedSettings }
    return merged[key] ?? defaultValue
  },

  setClientSetting: (key: string, value: ValueOption) => {
    const settingsStr = localStorage.getItem('clientSettings')
    const savedSettings = settingsStr ? JSON.parse(settingsStr) : {}
    const newSettings = { ...defaultWebConfig, ...savedSettings, [key]: value }
    localStorage.setItem('clientSettings', JSON.stringify(newSettings))
    set({ clientSettings: newSettings })
  },
}))
