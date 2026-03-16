import { API, api, createServerClient, setApiBaseUrl } from '@seerial/api';
import type { BasicUser, PersistedServer } from '@seerial/domain';
import { createWithEqualityFn } from 'zustand/traditional';

// ============================================================================
// Storage helpers
// ============================================================================

const KEYS = {
  SERVER: 'auth:server',
  USER: 'auth:user',
} as const;

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string) {
  localStorage.removeItem(key);
}

// ============================================================================
// Store interface
// ============================================================================

interface AuthState {
  // ── Server ────────────────────────────────────────────────────────────────
  selectedServer: PersistedServer | null;
  setSelectedServer: (server: PersistedServer | null) => void;
  serverOnline: boolean | null;
  serverCheckError: string | null;

  // ── User ──────────────────────────────────────────────────────────────────
  currentUser: BasicUser | null;
  setCurrentUser: (user: BasicUser | null) => void;

  // ── API Key (used elsewhere in the app) ───────────────────────────────────
  apiKeyStatus: boolean;
  gettingApiKeyStatus: boolean;
  setApiKey: (apiKey: string) => Promise<void>;

  // ── Initialization ────────────────────────────────────────────────────────
  initializeStatusChecks: () => Promise<void>;
  gettingServerStatus: boolean;
}

// ============================================================================
// Store
// ============================================================================

const persistedServer = load<PersistedServer>(KEYS.SERVER);
const persistedUser = load<BasicUser>(KEYS.USER);

// Point axios at the persisted server immediately (before any component mounts)
if (persistedServer?.url) {
  setApiBaseUrl(persistedServer.url);
}

export const useServerStore = createWithEqualityFn<AuthState>((set) => ({
  selectedServer: persistedServer,
  currentUser: persistedUser,
  serverOnline: null,
  serverCheckError: null,
  apiKeyStatus: false,
  gettingApiKeyStatus: false,
  gettingServerStatus: false,

  setSelectedServer: (server) => {
    if (server) {
      save(KEYS.SERVER, server);
      setApiBaseUrl(server.url);
    } else {
      remove(KEYS.SERVER);
    }
    set({ selectedServer: server });
  },

  setCurrentUser: (user) => {
    if (user) {
      save(KEYS.USER, user);
    } else {
      remove(KEYS.USER);
      void api.post<unknown>(API.users.logout).catch(() => undefined);
    }
    set({ currentUser: user });
  },

  setApiKey: async (apiKey) => {
    set({ gettingApiKeyStatus: true });
    try {
      const response = await api.post<{ data?: { status?: string } }>(API.configuration.apiKey, {
        apiKey,
      });
      set({
        apiKeyStatus: response?.data?.status === 'VALID_API_KEY',
        gettingApiKeyStatus: false,
      });
    } catch {
      set({ apiKeyStatus: false, gettingApiKeyStatus: false });
    }
  },

  initializeStatusChecks: async () => {
    set({ gettingServerStatus: true });

    // Get current state to access selectedServer
    const state = useServerStore.getState();

    // Check server status if a server is persisted
    if (state.selectedServer) {
      try {
        const client = createServerClient(state.selectedServer.url);
        // Try to reach the /servers endpoint for a quick check
        const response = await client.get('/servers');
        set({
          serverOnline: true,
          serverCheckError: null,
          apiKeyStatus: response.data?.data?.status === 'VALID_API_KEY',
          gettingServerStatus: false,
          gettingApiKeyStatus: false,
        });
      } catch (error) {
        set({
          serverOnline: false,
          serverCheckError: error instanceof Error ? error.message : 'Server unreachable',
          apiKeyStatus: false,
          gettingServerStatus: false,
        });
      }
    }
  },
}));
