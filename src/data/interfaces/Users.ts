export interface User {
  id: string
  email: string
  name?: string

  servers: Server[]
}

export interface Server {
  id: string
  ownerId: string
  name: string
  ip: string
}
