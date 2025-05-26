export interface User {
  id: string
  email: string
  name?: string
  image?: string
  servers: Server[]
}

export interface Server {
  id: string
  ip: string
  ownerId: string
  name: string
}
