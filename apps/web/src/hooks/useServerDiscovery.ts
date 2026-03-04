import { createServerClient } from '@/config/api'
import { DiscoveredServer, PersistedServer } from '@/data/interfaces/Servers'
import { BasicUser } from '@/data/interfaces/Users'
import { useCallback, useEffect, useState } from 'react'

const DEFAULT_PORT = 34200
const PROBE_TIMEOUT = 5000
const SAVED_SERVERS_KEY = 'auth:servers'

// Persistence helpers

function loadSavedServers(): PersistedServer[] {
  try {
    const raw = localStorage.getItem(SAVED_SERVERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistServer(server: PersistedServer) {
  const saved = loadSavedServers()
  if (!saved.find((s) => s.url === server.url)) {
    localStorage.setItem(SAVED_SERVERS_KEY, JSON.stringify([...saved, server]))
  }
}

// Probing

interface ProbeResult {
  name: string
  users: BasicUser[]
}

/**
 * Attempts to reach a server at `url`.
 * First calls /api/health for a quick reachability check,
 * then /api/servers to get name and users.
 * Returns null if the server is unreachable or times out.
 */
async function probeServer(
  url: string,
  timeout = PROBE_TIMEOUT,
): Promise<ProbeResult | null> {
  const client = createServerClient(url)

  try {
    // Quick reachability check
    await Promise.race([
      client.get('/health'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout),
      ),
    ])

    // Get server metadata (name + users)
    const { data } = await Promise.race([
      client.get('/servers'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout),
      ),
    ])

    return {
      name: data?.data?.name ?? url,
      users: (data?.data?.users as BasicUser[]) ?? [],
    }
  } catch {
    return null
  }
}

// Discovery candidates

function getAutoDiscoveryCandidates(): string[] {
  const candidates = new Set<string>()
  candidates.add(`http://localhost:${DEFAULT_PORT}`)

  const hostname = window.location.hostname
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    candidates.add(`http://${hostname}:${DEFAULT_PORT}`)
  }

  return [...candidates]
}

function normalizeUrl(host: string, port: number | string): string {
  const clean = host
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
  return `http://${clean}:${port}`
}

// Hook

export function useServerDiscovery() {
  const [servers, setServers] = useState<DiscoveredServer[]>([])

  // Patch a single server entry by key
  const patch = useCallback(
    (key: string, updates: Partial<DiscoveredServer>) => {
      setServers((prev) =>
        prev.map((s) => (s.key === key ? { ...s, ...updates } : s)),
      )
    },
    [],
  )

  // Probe a server and update its card
  const probeAndUpdate = useCallback(
    async (url: string) => {
      const result = await probeServer(url)
      if (result) {
        patch(url, {
          status: 'online',
          name: result.name,
          users: result.users,
        })
      } else {
        patch(url, { status: 'offline' })
      }
    },
    [patch],
  )

  // Run auto-discovery + load saved servers on mount
  useEffect(() => {
    const urlSet = new Set<string>()
    getAutoDiscoveryCandidates().forEach((u) => urlSet.add(u))
    loadSavedServers().forEach((s) => urlSet.add(s.url))

    const initial: DiscoveredServer[] = [...urlSet].map((url) => ({
      key: url,
      name: url,
      url,
      status: 'checking',
      users: [],
    }))

    setServers(initial)
    initial.forEach((s) => probeAndUpdate(s.url))
  }, [probeAndUpdate])

  /**
   * Manually add a server by host + port.
   * Returns true if the server responded successfully.
   */
  const addServer = useCallback(
    async (host: string, port: number | string): Promise<boolean> => {
      const url = normalizeUrl(host, port)

      setServers((prev) => {
        if (prev.find((s) => s.key === url)) return prev
        return [
          ...prev,
          { key: url, name: url, url, status: 'checking', users: [] },
        ]
      })

      const result = await probeServer(url)

      if (result) {
        persistServer({ name: result.name, url })
        patch(url, {
          status: 'online',
          name: result.name,
          users: result.users,
        })
        return true
      } else {
        patch(url, { status: 'offline' })
        return false
      }
    },
    [patch],
  )

  return { servers, addServer }
}
