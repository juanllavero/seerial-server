import { Server, User } from '@/data/interfaces/Users'
import { CENTRAL_SERVER } from '@/utils/constants'
import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  token: string | null
  user: User | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  changeUserName: (name: string) => Promise<void>
  isServerOwner: (server: Server | null) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (token) {
      setIsLoading(true)
      fetch(`https://${CENTRAL_SERVER}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setUser(data))
        .catch(() => logout())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const changeUserName = async (newName: string) => {
    if (!user) return

    const res = await fetch(`https://${CENTRAL_SERVER}/users/name`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    })

    if (res.ok) setUser({ ...user, name: newName })
  }

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const isServerOwner = (server: Server | null) => {
    if (!user || !server) return false
    return user.id === (server.owner?.id ?? server.ownerId)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        logout,
        changeUserName,
        isServerOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ha to be used within <AuthProvider>')
  return ctx
}
