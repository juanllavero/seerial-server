import { API, API_BASE_URL, authenticatedFetch } from '@/config/api'
import { BasicUser } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'

interface ServerState {
  users: BasicUser[]
  currentUser: BasicUser | null
  apiKeyStatus: boolean
  gettingApiKeyStatus: boolean
  gettingServerStatus: boolean
  getServerStatus: () => Promise<void>
  setCurrentUser: (user: BasicUser | null) => void
  setApiKey: (apiKey: string) => Promise<void>
}

/**
 * Pings a server URL with a short timeout to see if it's reachable.
 * Resolves with the URL if successful, otherwise rejects.
 * @param url The URL to ping.
 * @param timeout Milliseconds to wait before aborting.
 */
const pingServer = (url: string, timeout: number = 3000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(`Timeout after ${timeout}ms`))
    }, timeout)

    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then((res) => {
        // Any response, even an error status code, means the server is reachable.
        // We just need to know if we can talk to it.
        if (res) {
          clearTimeout(timeoutId)
          resolve(url)
        } else {
          throw new Error('Empty response')
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        // This will catch network errors, timeouts, and SSL certificate errors.
        reject(err)
      })
  })
}

export const useServerStore = createWithEqualityFn<ServerState>((set) => ({
  users: [],
  currentUser: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,
  gettingServerStatus: false,

  getServerStatus: async () => {
    set({ gettingServerStatus: true })

    try {
      // Use a standard 10-second timeout for regular requests
      const response = await pingServer(
        `${API_BASE_URL}${API.servers.status}`,
        10000,
      )
      // We need to actually get the data this time
      const data = await (await fetch(response)).json()

      console.log({ data })

      set({
        apiKeyStatus: data.status === 'VALID_API_KEY',
        gettingApiKeyStatus: false,
      })
    } finally {
      set({ gettingServerStatus: false })
    }
  },

  setCurrentUser: (user: BasicUser | null) => {
    set({ currentUser: user })
    localStorage.setItem('user', JSON.stringify(user))
  },

  setApiKey: async (apiKey) => {
    set({ gettingApiKeyStatus: true })

    try {
      const response = await authenticatedFetch(
        API.configuration.apiKey,
        'POST',
        {
          apiKey,
        },
      )
      if (!response || !response.status || response.status !== 200) {
        throw new Error()
      }
      const data = await response.data

      set({
        apiKeyStatus: data.status === 'VALID_API_KEY',
        gettingApiKeyStatus: false,
      })
    } catch (error) {
      console.error('Failed to set API Key', error)
      set({ apiKeyStatus: false, gettingApiKeyStatus: false })
    }
  },
}))
