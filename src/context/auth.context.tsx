import { User } from '@/data/interfaces/Users'
import { CENTRAL_SERVER } from '@/utils/constants'
import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  token: string | null
  user: User | null
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )
  const [user, setUser] = useState<AuthContextType['user']>(null)

  useEffect(() => {
    if (token) {
      fetch(`https://${CENTRAL_SERVER}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setUser(data))
        .catch(() => logout())
    }
  }, [token])

  const login = async (newToken: string) => {
    console.log('login', newToken)
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ha to be used within <AuthProvider>')
  return ctx
}
