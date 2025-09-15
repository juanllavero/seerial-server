export interface User {
  id: string
  email: string
  name?: string
  image?: string
  servers: Server[]
}

export interface SearchableUser {
  id: string
  email: string
  name?: string
}

export interface Server {
  id: string
  ip: string
  publicIp: string
  port: number
  ownerId: string
  name: string
}

export interface Invitation {
  id: string
  fromUser: SearchableUser
  createdAt: string
}
