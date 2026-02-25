import { API, authenticatedFetch, setApiBaseUrl } from '@/config/api'
import { PersistedServer } from '@/data/interfaces/Servers'
import { BasicUser } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'

// ============================================================================
// Storage helpers
// ============================================================================

const KEYS = {
  SERVER: 'auth:server',
  USER: 'auth:user',
} as const

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function remove(key: string) {
  localStorage.removeItem(key)
}

// ============================================================================
// Store interface
// ============================================================================

interface AuthState {
  // ── Server ────────────────────────────────────────────────────────────────
  selectedServer: PersistedServer | null
  setSelectedServer: (server: PersistedServer | null) => void

  // ── User ──────────────────────────────────────────────────────────────────
  currentUser: BasicUser | null
  setCurrentUser: (user: BasicUser | null) => void

  // ── API Key (used elsewhere in the app) ───────────────────────────────────
  apiKeyStatus: boolean
  gettingApiKeyStatus: boolean
  setApiKey: (apiKey: string) => Promise<void>
}

// ============================================================================
// Store
// ============================================================================

const persistedServer = load<PersistedServer>(KEYS.SERVER)
const persistedUser = load<BasicUser>(KEYS.USER)

// Point axios at the persisted server immediately (before any component mounts)
if (persistedServer?.url) {
  setApiBaseUrl(persistedServer.url)
}

export const useServerStore = createWithEqualityFn<AuthState>((set) => ({
  selectedServer: persistedServer,
  currentUser: persistedUser,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,

  setSelectedServer: (server) => {
    if (server) {
      save(KEYS.SERVER, server)
      setApiBaseUrl(server.url)
    } else {
      remove(KEYS.SERVER)
    }
    set({ selectedServer: server })
  },

  setCurrentUser: (user) => {
    if (user) {
      save(KEYS.USER, user)
    } else {
      remove(KEYS.USER)
      document.cookie = 'jwt=; path=/; max-age=0'
    }
    set({ currentUser: user })
  },

  setApiKey: async (apiKey) => {
    set({ gettingApiKeyStatus: true })
    try {
      const response = await authenticatedFetch(
        API.configuration.apiKey,
        'POST',
        { apiKey },
      )
      const data = response?.data
      set({
        apiKeyStatus: data?.data?.status === 'VALID_API_KEY',
        gettingApiKeyStatus: false,
      })
    } catch {
      set({ apiKeyStatus: false, gettingApiKeyStatus: false })
    }
  },
}))
