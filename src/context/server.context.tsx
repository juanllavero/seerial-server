import { create } from 'zustand'

interface ServerState {
  serverIP: string
  serverStatus: boolean
  serverVersion: string
  gettingServerStatus: boolean
  apiKeyStatus: boolean
  gettingApiKeyStatus: boolean
  setServerIP: (ip: string) => void
  getServerStatus: () => Promise<void>
  setApiKey: (apiKey: string) => Promise<void>
}

export const useServerStore = create<ServerState>((set, get) => ({
  serverIP: localStorage.getItem('serverIP') || '',
  serverStatus: false,
  serverVersion: '0.22.44',
  gettingServerStatus: false,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,

  setServerIP: (ip) => {
    localStorage.setItem('serverIP', ip)
    set({ serverIP: ip })
    get().getServerStatus()
  },

  getServerStatus: async () => {
    const { serverIP } = get()
    if (serverIP === '') return

    set({ gettingServerStatus: true })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout: The request took too long')),
        10000,
      ),
    )

    const fetchPromise = fetch(`https://${serverIP}/`).then((res) => res.json())

    try {
      const data = await Promise.race([fetchPromise, timeoutPromise])
      set({
        serverStatus: data.status !== undefined,
        apiKeyStatus: data.status === 'VALID_API_KEY',
        gettingApiKeyStatus: false,
      })
    } catch {
      set({ serverStatus: false })
    } finally {
      set({ gettingServerStatus: false })
    }
  },

  setApiKey: async (apiKey) => {
    const { serverIP } = get()
    if (serverIP === '') return

    set({ gettingApiKeyStatus: true })

    const response = await fetch(`https://${serverIP}/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    })
    const data = await response.json()

    set({
      apiKeyStatus: data.status === 'VALID_API_KEY',
      gettingApiKeyStatus: false,
    })
  },
}))
