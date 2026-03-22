import { createServerClient } from '@seerial/api'
import type { BasicUser, DiscoveredServer, PersistedServer } from '@seerial/domain'
import { useCallback, useEffect, useState } from 'react'

const DEFAULT_PORT = 34200
const PROBE_TIMEOUT = 5000
const SAVED_SERVERS_KEY = 'auth:servers'
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

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
async function probeServer(url: string, timeout = PROBE_TIMEOUT): Promise<ProbeResult | null> {
  const client = createServerClient(url)

  try {
    // Quick reachability check
    await Promise.race([
      client.get('/health'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
    ])

    // Get server metadata (name + users)
    const { data } = await Promise.race([
      client.get('/servers'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
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

function isPrivateIpv4(value: string): boolean {
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return false

  const octets = match.slice(1).map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return false

  const [first, second] = octets
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
}

function toCanonicalServerUrl(url: string, privateIp: string | null): string {
  if (!privateIp) return url

  try {
    const parsed = new URL(url)
    if (!LOCALHOST_HOSTS.has(parsed.hostname)) return url

    parsed.hostname = privateIp
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

async function detectPrivateIpv4(): Promise<string | null> {
  const host = window.location.hostname
  if (isPrivateIpv4(host)) return host

  const PeerConnection =
    window.RTCPeerConnection ||
    (window as Window & { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection

  if (!PeerConnection) return null

  return new Promise((resolve) => {
    const connection = new PeerConnection({ iceServers: [] })
    const timeout = window.setTimeout(() => {
      connection.close()
      resolve(null)
    }, 1000)

    const finish = (ip: string | null) => {
      window.clearTimeout(timeout)
      connection.close()
      resolve(ip)
    }

    connection.onicecandidate = (event) => {
      const candidate = event.candidate?.candidate
      if (!candidate) return

      const ipv4Matches = candidate.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)
      if (!ipv4Matches) return

      const privateIp = ipv4Matches.find(isPrivateIpv4)
      if (privateIp) {
        finish(privateIp)
      }
    }

    void connection.createDataChannel('discover-ip')
    void connection
      .createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .catch(() => finish(null))
  })
}

// Hook

export function useServerDiscovery() {
  const [servers, setServers] = useState<DiscoveredServer[]>([])
  const [privateIp, setPrivateIp] = useState<string | null>(null)

  // Patch a single server entry by key
  const patch = useCallback((key: string, updates: Partial<DiscoveredServer>) => {
    setServers((prev) => prev.map((s) => (s.key === key ? { ...s, ...updates } : s)))
  }, [])

  useEffect(() => {
    void detectPrivateIpv4().then((ip) => {
      if (ip) {
        setPrivateIp(ip)
      }
    })
  }, [])

  // Probe a server and update its card
  const probeAndUpdate = useCallback(
    async (url: string) => {
      const result = await probeServer(url)
      if (result) {
        const canonicalUrl = toCanonicalServerUrl(url, privateIp)
        patch(url, {
          key: canonicalUrl,
          url: canonicalUrl,
          status: 'online',
          name: result.name,
          users: result.users,
        })
      } else {
        patch(url, { status: 'offline' })
      }
    },
    [patch, privateIp],
  )

  // Run auto-discovery + load saved servers on mount
  useEffect(() => {
    const urlSet = new Set<string>()
    getAutoDiscoveryCandidates().forEach((u) => {
      urlSet.add(u)
    })
    loadSavedServers().forEach((s) => {
      urlSet.add(s.url)
    })

    const initial: DiscoveredServer[] = [...urlSet].map((url) => ({
      key: url,
      name: url,
      url,
      status: 'checking',
      users: [],
    }))

    setServers(initial)
    initial.forEach((s) => {
      void probeAndUpdate(s.url)
    })
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
        return [...prev, { key: url, name: url, url, status: 'checking', users: [] }]
      })

      const result = await probeServer(url)

      if (result) {
        const canonicalUrl = toCanonicalServerUrl(url, privateIp)
        persistServer({ name: result.name, url: canonicalUrl })
        patch(url, {
          key: canonicalUrl,
          url: canonicalUrl,
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
    [patch, privateIp],
  )

  return { servers, addServer }
}
