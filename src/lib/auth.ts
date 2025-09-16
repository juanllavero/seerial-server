import {
  Invitation,
  SearchableUser,
  SharedServer,
  User,
} from '@/data/interfaces/Users'
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

export async function searchUsers(query: string): Promise<SearchableUser[]> {
  const token = getToken()
  if (!token) return []

  const res = await fetch(
    `https://${CENTRAL_SERVER}/users/search?q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!res.ok) return []

  return await res.json()
}

export async function sendInvitation(toUserId: string) {
  const token = getToken()
  if (!token) return null

  const res = await fetch(`https://${CENTRAL_SERVER}/friends/invitations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ toUserId }),
  })

  const data = await res.json()

  if (data.error) {
    console.log(data.error)
    return data.error
  }

  return null
}

export async function getInvitations(): Promise<Invitation[]> {
  const token = getToken()
  if (!token) return []

  const res = await fetch(`https://${CENTRAL_SERVER}/friends/invitations`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return []

  return await res.json()
}

export async function acceptInvitation(invitationId: string) {
  const token = getToken()
  if (!token) return null

  await fetch(
    `https://${CENTRAL_SERVER}/friends/invitations/${invitationId}/accept`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
}

export async function rejectInvitation(invitationId: string) {
  const token = getToken()
  if (!token) return null

  await fetch(
    `https://${CENTRAL_SERVER}/friends/invitations/${invitationId}/reject`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
}

export async function getFriends(): Promise<SearchableUser[]> {
  const token = getToken()
  if (!token) return []

  const res = await fetch(`https://${CENTRAL_SERVER}/friends`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return []

  return await res.json()
}

export async function shareLibraries(
  serverId: string,
  userId: string,
  libraries: string[],
) {
  const token = getToken()
  if (!token) return null

  await fetch(`https://${CENTRAL_SERVER}/servers/${serverId}/share`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, libraries }),
  })
}

export async function getSharedServers(
  userId: string,
): Promise<SharedServer[]> {
  const token = getToken()
  if (!token) return []

  const res = await fetch(
    `https://${CENTRAL_SERVER}/servers/shared?userId=${userId}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!res.ok) return []

  return await res.json()
}

export async function deleteSharedServer(serverId: string, userId: string) {
  const token = getToken()
  if (!token) return null

  await fetch(`https://${CENTRAL_SERVER}/servers/${serverId}/share/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteOwnServer(serverId: string) {
  const token = getToken()
  if (!token) return null

  await fetch(`https://${CENTRAL_SERVER}/servers/${serverId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
