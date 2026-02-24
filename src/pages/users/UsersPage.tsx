import Loading from '@/components/Loading'
import Image from '@/components/ui/Image'
import { Input } from '@/components/ui/input'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { useServerStore } from '@/context/server.context'
import { BasicUser } from '@/data/interfaces/Users'
import { ArrowLeft, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'

export default function UsersPage() {
  const { currentUser, setCurrentUser } = useServerStore(
    (state) => ({
      currentUser: state.currentUser,
      setCurrentUser: state.setCurrentUser,
    }),
    shallow,
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [profilePassword, setProfilePassword] = useState('')
  const [newUserType, setNewUserType] = useState('regular') // 'regular' or 'admin'
  const [selectedUser, setSelectedUser] = useState<BasicUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch users registered in the server
  const { data, isLoading: gettingUsers } = useSWR<any>(
    API.users.findAllPublic,
    authenticatedFetcher,
  )

  const users = data && (data.data as BasicUser[])

  const defaultSection = users && users.length > 0 ? 'profiles' : 'manual'
  const [view, setView] = useState(defaultSection) // 'profiles', 'manual', 'addUser', 'servers'
  const navigate = useNavigate()

  if (currentUser) {
    navigate('/home')
    return null
  }

  const handleUserClick = (user: any) => {
    setSelectedUser(user === selectedUser ? null : user)
    setProfilePassword('')
    setErrorMessage('')
  }

  const handleProfileLogin = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await authenticatedFetch(API.users.login, 'POST', {
        username: selectedUser?.username,
        password: profilePassword ?? '',
      })
      // Set JWT token as cookie
      document.cookie = `jwt=${response.data.token}; path=/; max-age=2592000; samesite=strict`
      setCurrentUser(response.data.user)
      setIsLoading(false)
      navigate('/home')
      return
    } catch (error) {
      setIsLoading(false)
      setErrorMessage('Contraseña incorrecta')
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    }
  }

  const handleManualLogin = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await authenticatedFetch(API.users.login, 'POST', {
        username: username,
        password: password ?? '',
      })
      // Set JWT token as cookie
      document.cookie = `jwt=${response.data.token}; path=/; max-age=2592000; samesite=strict`
      setCurrentUser(response.data.user)
      setIsLoading(false)
      navigate('/home')
      return
    } catch (error) {
      setIsLoading(false)
      setErrorMessage('Contraseña incorrecta')
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    }
  }

  const handleAddUser = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await authenticatedFetch(API.users.create, 'POST', {
        username: username,
        password: password,
        type: newUserType,
      })
      // Set JWT token as cookie
      document.cookie = `jwt=${response.data.token}; path=/; max-age=2592000; samesite=strict`
      setCurrentUser(response.data.user)
      setIsLoading(false)
      navigate('/home')
      return
    } catch (error) {
      setIsLoading(false)
      setErrorMessage('Error al crear usuario')
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    }
  }

  if (gettingUsers) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-cyan-900 via-cyan-950 to-black">
      <div className="w-full max-w-5xl px-8">
        {/* Logo y título */}
        <div className="absolute top-5 left-5 flex w-40 flex-row justify-center">
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
          {users && users.length > 0 && (
            <>
              <h1 className="mb-12 text-center text-4xl font-bold tracking-tight text-white">
                Perfiles
              </h1>
              {/* Users Grid */}
              <div className="mb-8 flex flex-wrap justify-center gap-6">
                {users.map((user: BasicUser) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`group flex flex-col items-center transition-all duration-300 hover:scale-110 focus:outline-none ${
                      selectedUser?.id === user.id ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`relative mb-4 flex h-25 w-25 items-center justify-center rounded-full bg-stone-700 bg-linear-to-br text-6xl shadow-lg transition-all duration-300 ${
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
                    className="focus:ring-opacity-50 bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full transform items-center justify-center rounded-lg bg-linear-to-r py-4 text-lg font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
              <div className="flex flex-col justify-center gap-4">
                <button
                  onClick={() => {
                    setView('manual')
                    setSelectedUser(null)
                    setErrorMessage('')
                  }}
                  className="focus:ring-opacity-50 focus:ring-app-color mx-auto flex w-full max-w-md transform items-center justify-center rounded-lg bg-white bg-linear-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  Acceder Manualmente
                </button>
                <button
                  onClick={() => {
                    setView('addUser')
                    setUsername('')
                    setPassword('')
                    setNewUserType('regular')
                    setErrorMessage('')
                  }}
                  className="focus:ring-opacity-50 focus:ring-app-color mx-auto flex w-full max-w-md transform items-center justify-center rounded-lg bg-white bg-linear-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  Añadir Usuario
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
          {users && users.length > 0 && (
            <button
              onClick={() => {
                setView(defaultSection)
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
              className="focus:ring-opacity-50 bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full transform items-center justify-center rounded-lg bg-linear-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              ) : (
                'Acceder'
              )}
            </button>
            <button
              onClick={() => {
                setView('addUser')
                setUsername('')
                setPassword('')
                setNewUserType('regular')
                setErrorMessage('')
              }}
              className="focus:ring-opacity-50 focus:ring-app-color mx-auto flex w-full max-w-md transform items-center justify-center rounded-lg bg-white bg-linear-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              Añadir Usuario
            </button>
          </div>
        </div>
        {/* Add User Section */}
        <div
          className={`${
            view === 'addUser'
              ? 'opacity-100'
              : 'pointer-events-none absolute opacity-0'
          }`}
        >
          {/* Back Button */}
          <button
            onClick={() => {
              setView(defaultSection)
              setErrorMessage('')
            }}
            className="mb-8 flex items-center gap-2 text-white transition-colors duration-300 focus:outline-none"
          >
            <ArrowLeft size={24} />
            <span className="text-lg">Volver</span>
          </button>
          <h1 className="mb-12 text-center text-4xl font-bold tracking-tight text-white">
            Añadir Usuario
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
                placeholder="Introduce el nombre de usuario"
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
                disabled={isLoading}
                className="w-full rounded-md bg-black px-5 py-7 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Introduce la contraseña"
              />
            </div>
            <div>
              <label className="mb-3 block text-lg font-medium text-white">
                Tipo de Usuario
              </label>
              <select
                value={newUserType}
                onChange={(e) => setNewUserType(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md bg-black p-5 text-white transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="normal">Usuario Regular</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {errorMessage && (
              <div className="mt-3 animate-pulse text-sm font-medium text-red-400">
                {errorMessage}
              </div>
            )}
            <button
              onClick={handleAddUser}
              disabled={
                isLoading ||
                !username.trim() ||
                (newUserType === 'admin' && !password.trim())
              }
              className="focus:ring-opacity-50 bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full transform items-center justify-center rounded-lg bg-linear-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-2xl focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              ) : (
                'Añadir'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
