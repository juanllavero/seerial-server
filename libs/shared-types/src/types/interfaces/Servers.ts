import { BasicUser, User } from './Users'

export type ServerStatus = 'checking' | 'online' | 'offline'

/** Server as discovered/probed during the discovery phase */
export interface DiscoveredServer {
  /** Unique key — the base URL, e.g. "http://192.168.1.10:34200" */
  key: string
  name: string
  url: string
  status: ServerStatus
  users: BasicUser[]
}

/** Minimal shape persisted in localStorage after a successful connection */
export interface PersistedServer {
  name: string
  url: string
}

export interface Server {
  id: string
  ip: string
  user?: User
  publicIp: string
  shared: boolean
  port: number
  owner?: User
  ownerId: string
  name: string
  tunnel?: string
  libraries: string[] | null
}

export interface BasicServer {
  id: string
  name: string
  status: string
  url: string
  users: BasicUser[]
}
