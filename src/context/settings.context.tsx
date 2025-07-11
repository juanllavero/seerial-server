import { Settings, SettingsSection, ValueOption } from '@/data/interfaces/Utils'
import { createWithEqualityFn } from 'zustand/traditional'

interface SettingsStore {
  clientSettings: Settings
  serverSettings: Settings
  settingsSection: SettingsSection
  setSettingsSection: (section: SettingsSection) => void
  setClientSettings: (settings: Settings) => void
  setServerSettings: (settings: Settings) => void
  getAllServerSettings: (serverUrl: string) => Promise<any>
  getServerSetting: (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => any
  setServerSetting: (serverUrl: string, key: string, value: ValueOption) => void

  getAllClientSettings: (serverUrl: string) => Promise<any>
  getClientSetting: (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => any
  setClientSetting: (serverUrl: string, key: string, value: ValueOption) => void
}

export const useSettingsStore = createWithEqualityFn<SettingsStore>((set) => ({
  clientSettings: {},
  serverSettings: {},
  settingsSection: SettingsSection.ClientGeneral,
  setSettingsSection: (section: SettingsSection) =>
    set((state) => ({
      settingsSection: section,
    })),
  setClientSettings: (settings: Settings) =>
    set((state) => ({
      clientSettings: settings,
      serverSettings: state.serverSettings,
    })),
  setServerSettings: (settings: Settings) =>
    set((state) => ({
      serverSettings: settings,
      clientSettings: state.clientSettings,
    })),
  getAllServerSettings: async (serverUrl: string) => {
    const settings = await fetch(`${serverUrl}/serverConfig`)
    const result = await settings.json()
    set({ serverSettings: result })
  },
  getServerSetting: async (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => {
    const setting = await fetch(`${serverUrl}/serverConfig/${key}`)
    const result = await setting.json()

    return result ? result.value : defaultValue
  },
  setServerSetting: async (
    serverUrl: string,
    key: string,
    value: ValueOption,
  ) => {
    fetch(`${serverUrl}/serverConfig`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
  },

  getAllClientSettings: async (serverUrl: string) => {
    const settings = await fetch(`${serverUrl}/webConfig`)
    const result = await settings.json()
    set({ clientSettings: result })
  },
  getClientSetting: async (
    serverUrl: string,
    key: string,
    defaultValue: ValueOption,
  ) => {
    const setting = await fetch(`${serverUrl}/webConfig/${key}`)
    const result = await setting.json()

    return result ? result.value : defaultValue
  },
  setClientSetting: async (
    serverUrl: string,
    key: string,
    value: ValueOption,
  ) => {
    fetch(`${serverUrl}/webConfig`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
  },
}))
