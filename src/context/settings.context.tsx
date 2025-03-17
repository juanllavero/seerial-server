import { create } from 'zustand'

interface SettingsStore {
  getServerSetting: (serverIP: string, key: string, defaultValue: string) => any
  setServerSetting: (serverIP: string, key: string, value: string) => void
}

export const useSettingsStore = create<SettingsStore>(() => ({
    getServerSetting: async (serverIP: string, key: string, defaultValue: string) => {
    const setting = await fetch(`https://${serverIP}/serverConfig/${key}`)
    const result =  await setting.json()

    return result ? result.value : defaultValue
  },
  setServerSetting: async (serverIP: string, key: string, value: string) => {
    fetch(`https://${serverIP}/serverConfig`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
  }
}))
