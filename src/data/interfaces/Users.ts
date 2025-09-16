export interface User {
  id: string
  email: string
  name?: string
  image?: string
  servers: Server[]
  sharedServers: SharedServer[]
}

export interface SearchableUser {
  id: string
  email: string
  image?: string
  name?: string
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

export interface SharedServer {
  id: string
  ip?: string
  name?: string
  server: Server
  serverId: string
  user: User
  userId: string
  libraries: string[]
}

export interface Invitation {
  id: string
  fromUser: SearchableUser
  createdAt: string
}
