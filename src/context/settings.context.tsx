import { ValueOption } from '@/data/interfaces/Utils'
import { create } from 'zustand'

interface SettingsStore {
  getAllServerSettings: (serverIP: string) => Promise<any>
  getServerSetting: (
    serverIP: string,
    key: string,
    defaultValue: ValueOption,
  ) => any
  setServerSetting: (serverIP: string, key: string, value: ValueOption) => void

  getAllClientSettings: (serverIP: string) => Promise<any>
  getClientSetting: (
    serverIP: string,
    key: string,
    defaultValue: ValueOption,
  ) => any
  setClientSetting: (serverIP: string, key: string, value: ValueOption) => void
}

export const useSettingsStore = create<SettingsStore>(() => ({
  getAllServerSettings: async (serverIP: string) => {
    const settings = await fetch(`https://${serverIP}/serverConfig`)
    const result = await settings.json()
    return result
  },
  getServerSetting: async (
    serverIP: string,
    key: string,
    defaultValue: ValueOption,
  ) => {
    const setting = await fetch(`https://${serverIP}/serverConfig/${key}`)
    const result = await setting.json()

    return result ? result.value : defaultValue
  },
  setServerSetting: async (
    serverIP: string,
    key: string,
    value: ValueOption,
  ) => {
    fetch(`https://${serverIP}/serverConfig`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
  },

  getAllClientSettings: async (serverIP: string) => {
    const settings = await fetch(`https://${serverIP}/webConfig`)
    const result = await settings.json()
    return result
  },
  getClientSetting: async (
    serverIP: string,
    key: string,
    defaultValue: ValueOption,
  ) => {
    const setting = await fetch(`https://${serverIP}/webConfig/${key}`)
    const result = await setting.json()

    return result ? result.value : defaultValue
  },
  setClientSetting: async (
    serverIP: string,
    key: string,
    value: ValueOption,
  ) => {
    fetch(`https://${serverIP}/webConfig`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
  },
}))
