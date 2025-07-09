import { Server } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'

interface ServerState {
  selectedServer: Server | null
  serverIP: string
  serverStatus: boolean
  serverVersion: string
  gettingServerStatus: boolean
  apiKeyStatus: boolean
  gettingApiKeyStatus: boolean
  selectServer: (server: Server | null) => Promise<void>
  getServerStatus: () => Promise<void>
  setApiKey: (apiKey: string) => Promise<void>
}

// Aux function to check server connectivity
const checkServerConnectivity = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url)
    const data = await response.json()

    // If the server returns an ID and a status, it's accessible
    return typeof data.id !== 'undefined' && typeof data.status !== 'undefined'
  } catch (error) {
    return false
  }
}

export const useServerStore = createWithEqualityFn<ServerState>((set, get) => ({
  selectedServer: null,
  serverStatus: false,
  serverIP: '',
  serverVersion: '',
  gettingServerStatus: false,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,

  selectServer: async (server) => {
    if (server?.id === get().selectedServer?.id) {
      return
    }

    set({
      selectedServer: server,
      serverIP: '',
      serverStatus: false,
      apiKeyStatus: false,
    })

    if (!server) {
      return
    }

    console.log(`Trying to connect to ${server.ip}:${server.port}`)

    // Try to connect to the local IP
    const localUrl = `http://${server.ip}:${server.port}/`
    const isLocalReachable = await checkServerConnectivity(localUrl)

    if (isLocalReachable) {
      console.log(`Connected to ${server.ip}:${server.port}`)
      set({ serverIP: `${server.ip}:${server.port}` })
    } else {
      // Fallback to public IP
      console.log(
        `Connected to ${server.ip}:${server.port} or ${server.publicIp}:${server.port}`,
      )
      set({ serverIP: `${server.publicIp}:${server.port}` })
    }

    await get().getServerStatus()
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

    const fetchPromise = fetch(
      `http://${selectedServer.ip}:${selectedServer.port}/`,
    ).then((res) => res.json())

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

    const response = await fetch(
      `http://${selectedServer.ip}:${selectedServer.port}/api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      },
    )
    const data = await response.json()

    set({
      apiKeyStatus: data.status === 'VALID_API_KEY',
      gettingApiKeyStatus: false,
    })
  },
}))
