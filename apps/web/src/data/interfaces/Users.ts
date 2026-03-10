import type { Server } from 'http'
import type { UserType } from '@/utils/constants'

export interface User {
  id: string
  type: UserType
  email: string
  name?: string
  image?: string
  servers: Server[]
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
