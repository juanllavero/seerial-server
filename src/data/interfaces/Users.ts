import { UserType } from '@/utils/constants'

export interface User {
  id: string
  type: UserType
  email: string
  name?: string
  image?: string
  servers: Server[]
  sharedServers: SharedServer[]
}

export interface BasicUser {
  id: string
  username: string
  avatar: string | null
  type: UserType
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

export interface BasicServer {
  id: string
  name: string
  status: string
  url: string
  users: BasicUser[]
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
