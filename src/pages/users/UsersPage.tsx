import { useState } from 'react'
import Image from '@/components/ui/Image'
import { ArrowLeft, User, Plus, UserIcon, Server } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/context/server.context'
import { shallow } from 'zustand/shallow'
import useSWR from 'swr'
import { Navigate, useNavigate } from 'react-router-dom'
import { BasicUser } from '@/data/interfaces/Users'
import { authenticatedFetch } from '@/lib/auth'

interface User {
  id: number
  name: string
  avatar: string
  type: string
}

export default function UsersPage() {
  const [view, setView] = useState('profiles') // 'profiles', 'manual', 'servers'
  const { server, servers, addServer, resetServerSelection, setCurrentUser } =
    useServerStore(
      (state) => ({
        server: state.server,
        servers: state.servers,
        addServer: state.addServer,
        resetServerSelection: state.resetServerSelection,
        setCurrentUser: state.setCurrentUser,
      }),
      shallow,
    )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [profilePassword, setProfilePassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<BasicUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  const hasUsers = server && server.users && server.users?.length > 0

  console.log({ server, servers })

  if (!server) return <Navigate to="/login" />

  const handleUserClick = (user: any) => {
    setSelectedUser(user === selectedUser ? null : user)
    setProfilePassword('')
    setErrorMessage('')
  }

  const handleProfileLogin = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const response = await authenticatedFetch(
      `${server.url}users/login`,
      'POST',
      {
        username: selectedUser?.username,
        password: profilePassword,
      },
    )

    if (response.ok) {
      const data = await response.json()
      console.log({ data })
      setCurrentUser(selectedUser)
      setIsLoading(false)
      navigate('/home')
      return
    }

    setIsLoading(false)
    setErrorMessage('Contraseña incorrecta')

    setTimeout(() => {
      setErrorMessage('')
    }, 5000)
  }

  const handleManualLogin = () => {
    if (username.trim()) {
      setIsLoading(true)
      setErrorMessage('')

      setTimeout(() => {
        setIsLoading(false)
        setErrorMessage('Usuario o contraseña incorrectos')

        setTimeout(() => {
          setErrorMessage('')
        }, 5000)
      }, 2000)
    }
  }

  const handleServerClick = (newServer: any) => {
    if (newServer.id !== server?.id) {
      addServer(newServer)
    }
  }

  const handleAddServer = () => {
    resetServerSelection()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900 via-cyan-950 to-black">
      <div className="w-full max-w-5xl px-8">
        {/* Logo y título */}
        <div className="absolute top-5 left-5 flex w-[10rem] flex-row justify-center">
          <Image src="/img/banner.svg" alt="Logo" aspectRatio={21 / 9} />
        </div>

        {/* Profiles Section */}
        <div
          className={`${
            view === 'profiles'
              ? 'opacity-100'
              : 'pointer-events-none absolute opacity-0'
          }`}
        >
          {hasUsers && (
            <>
              <h1 className="mb-12 text-center text-4xl font-bold tracking-tight text-white">
                Perfiles
              </h1>

              {/* Users Grid */}
              <div className="mb-8 flex flex-wrap justify-center gap-6">
                {server?.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`group flex flex-col items-center transition-all duration-300 hover:scale-110 focus:outline-none ${
                      selectedUser?.id === user.id ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`relative mb-4 flex h-25 w-25 items-center justify-center rounded-full bg-stone-700 bg-gradient-to-br text-6xl shadow-lg transition-all duration-300 ${
                        selectedUser?.id === user.id
                          ? 'ring-app-color shadow-2xl ring-3'
                          : ''
                      }`}
                    >
                      <UserIcon size={28} />
                      {user.type === 'admin' && (
                        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold shadow-lg">
                          ★
                        </div>
                      )}
                    </div>
                    <span
                      className={`group-hover:text-app-color text-xl font-medium text-white transition-colors ${
                        selectedUser?.id === user.id ? 'text-app-color' : ''
                      }`}
                    >
                      {user.username}
                    </span>
                  </button>
                ))}
              </div>

              {/* Profile Password Input */}
              {selectedUser && (
                <div className="animate-in fade-in mx-auto mb-8 max-w-md duration-300">
                  <Input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        handleProfileLogin()
                      }
                    }}
                    disabled={isLoading}
                    placeholder={`Contraseña para ${selectedUser.username}`}
                    className="mb-5 w-full rounded-md bg-black px-5 py-7 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    autoFocus
                  />

                  {errorMessage && (
                    <div className="mb-3 animate-pulse text-left text-sm font-medium text-red-400">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handleProfileLogin}
                    disabled={isLoading}
                    className="focus:ring-opacity-50 bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full transform items-center justify-center rounded-lg bg-gradient-to-r py-4 text-lg font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setView('manual')
                    setSelectedUser(null)
                    setErrorMessage('')
                  }}
                  className="focus:ring-opacity-50 focus:ring-app-color mx-auto flex w-full max-w-md transform items-center justify-center rounded-lg bg-white bg-gradient-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  Acceder Manualmente
                </button>
              </div>
            </>
          )}
        </div>

        {/* Manual Login Section */}
        <div
          className={`${
            view === 'manual'
              ? 'opacity-100'
              : 'pointer-events-none absolute opacity-0'
          }`}
        >
          {/* Back Button */}
          {hasUsers && (
            <button
              onClick={() => {
                setView('profiles')
                setErrorMessage('')
              }}
              className="mb-8 flex items-center gap-2 text-white transition-colors duration-300 focus:outline-none"
            >
              <ArrowLeft size={24} />
              <span className="text-lg">Volver</span>
            </button>
          )}

          <h1 className="mb-12 text-center text-4xl font-bold tracking-tight text-white">
            Acceder Manualmente
          </h1>

          <div className="mx-auto max-w-md space-y-6">
            <div>
              <label className="mb-3 block text-lg font-medium text-white">
                Usuario
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md bg-black px-5 py-7 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Introduce tu usuario"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-medium text-white">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    handleManualLogin()
                  }
                }}
                disabled={isLoading}
                className="w-full rounded-md bg-black px-5 py-7 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Introduce tu contraseña"
              />

              {errorMessage && (
                <div className="mt-3 animate-pulse text-sm font-medium text-red-400">
                  {errorMessage}
                </div>
              )}
            </div>

            <button
              onClick={handleManualLogin}
              disabled={isLoading || !username.trim()}
              className="focus:ring-opacity-50 bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full transform items-center justify-center rounded-lg bg-gradient-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              ) : (
                'Acceder'
              )}
            </button>
          </div>
        </div>

        {/* Servers Section */}
        <div
          className={`${
            view === 'servers'
              ? 'opacity-100'
              : 'pointer-events-none absolute opacity-0'
          }`}
        >
          {/* Back Button */}
          <button
            onClick={() => setView(hasUsers ? 'profiles' : 'manual')}
            className="mb-8 flex items-center gap-2 text-white transition-colors duration-300 focus:outline-none"
          >
            <ArrowLeft size={24} />
            <span className="text-lg">Volver</span>
          </button>

          <h1 className="mb-12 text-center text-4xl font-bold tracking-tight text-white">
            Cambiar Servidor
          </h1>

          {/* Servers Grid */}
          <div className="mb-12 flex flex-wrap justify-center gap-6">
            {servers.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerClick(server)}
                className="group flex flex-col items-center transition-all duration-300 hover:scale-110 focus:outline-none"
              >
                <div className="group-hover:bg-app-color mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-stone-700 bg-gradient-to-br text-6xl shadow-lg transition-all duration-300 group-hover:text-stone-700 group-hover:shadow-2xl">
                  <Server size={48} />
                </div>
                <span className="group-hover:text-app-color max-w-[240px] text-center text-lg font-medium text-white transition-colors">
                  {server.name}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => handleAddServer()}
              className="focus:ring-opacity-50 bg-app-color focus:ring-app-color hover:bg-app-color/90 flex items-center gap-3 rounded-lg bg-gradient-to-r px-8 py-4 text-lg font-medium text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none"
            >
              <Plus size={24} />
              Añadir Servidor
            </button>
          </div>
        </div>

        {/* Change Server Button - Always visible */}
        <div
          className={`mt-3 flex justify-center transition-opacity duration-500 ${
            view === 'servers' ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <button
            onClick={() => setView('servers')}
            className="focus:ring-opacity-50 focus:ring-app-color mx-auto flex w-full max-w-md transform items-center justify-center rounded-lg bg-white bg-gradient-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            Cambiar Servidor
          </button>
        </div>
      </div>
    </div>
  )
}
