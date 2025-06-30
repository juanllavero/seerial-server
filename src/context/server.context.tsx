import { Server } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'

interface ServerState {
  selectedServer: Server | null
  serverStatus: boolean
  serverVersion: string
  gettingServerStatus: boolean
  apiKeyStatus: boolean
  gettingApiKeyStatus: boolean
  selectServer: (server: Server | null) => void
  getServerStatus: () => Promise<void>
  setApiKey: (apiKey: string) => Promise<void>
}

export const useServerStore = createWithEqualityFn<ServerState>((set, get) => ({
  selectedServer: null,
  serverStatus: false,
  serverVersion: '',
  gettingServerStatus: false,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,

  selectServer: (server) => {
    set((state) => {
      if (server?.id === state.selectedServer?.id) {
        return state
      }
      return { selectedServer: server }
    })
    get().getServerStatus()
  },

  getServerStatus: async () => {
    const { selectedServer } = get()
    if (!selectedServer) return

    set({ gettingServerStatus: true })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout: The request took too long')),
        10000,
      ),
    )

    const fetchPromise = fetch(`https://${selectedServer.ip}/`).then((res) =>
      res.json(),
    )

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
    const { selectedServer } = get()
    if (!selectedServer) return

    set({ gettingApiKeyStatus: true })

    const response = await fetch(`https://${selectedServer.ip}/api-key`, {
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
