import { User } from '@/data/interfaces/Users'
import { CENTRAL_SERVER } from '@/utils/constants'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function getUser(): Promise<User | null> {
  const token = getToken()
  if (!token) return null

  const res = await fetch(`https://${CENTRAL_SERVER}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null

  return await res.json()
}
