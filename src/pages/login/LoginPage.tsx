import { useAuth } from '@/context/auth.context'
import { getToken } from '@/lib/auth'
import { CENTRAL_SERVER } from '@/utils/constants'
import { showToast } from '@/utils/ReactUtils'
import { useGoogleLogin } from '@react-oauth/google'
import { Film, Loader2, Music, Tv } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Image from '@/components/ui/Image'
import BackgroundEffect from './components/BackgroundEffect'
import { useIsMobile } from '@/components/hooks/use-mobile'

function LoginPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { login } = useAuth()
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = getToken()
  const [searchParams] = useSearchParams()
  const claimToken = searchParams.get('token')

  if (token || user) navigate('/home')

  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async (tokenResponse: { access_token: string }) => {
    const accessToken = tokenResponse.access_token
    if (!accessToken) {
      alert('No se recibió access_token de Google')
      return
    }

    try {
      const res = await fetch(`https://${CENTRAL_SERVER}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        // If the user has a claim token, we need to send it to the server
        if (claimToken) {
          await fetch(`https://${CENTRAL_SERVER}/claim/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Use the user token to authenticate the request
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ claim_token: claimToken }),
          })
          showToast('success', 'Server registered successfully')
        }

        await login(data.token)
        setIsLoading(false)
        navigate('/home')
      } else {
        showToast('error', t('loginError'))
        setIsLoading(false)
      }
    } catch (error) {
      alert('Error conectando con el servidor')
      console.error(error)
    }
  }

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: handleGoogleLogin,
    onError: () => {
      showToast('error', t('googleLoginError'))
      setIsLoading(false)
    },
    onNonOAuthError: () => {
      showToast('error', t('googleLoginError'))
      setIsLoading(false)
    },
  })

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <BackgroundEffect />

      {/* Contenido principal */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo y título */}
          <div className="text-center">
            <div className="flex flex-row justify-center">
              <Image src="/img/banner.svg" alt="Logo" aspectRatio={21 / 9} />
            </div>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-500 sm:text-base">
              Organiza y disfruta tu biblioteca multimedia personal como nunca
              antes
            </p>
          </div>

          {/* Tarjeta de login */}
          <div className="rounded-3xl border border-gray-800 bg-gray-600/50 p-8 shadow-2xl backdrop-blur-lg">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-semibold text-white">
                  Bienvenido
                </h2>
                <p className="text-sm text-gray-400">
                  Inicia sesión para acceder a tu biblioteca personal
                </p>
              </div>

              <button
                onClick={() => {
                  if (isLoading) return

                  setIsLoading(true)
                  googleLogin()
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                disabled={isLoading}
                className={`flex w-full transform items-center justify-center rounded-2xl bg-white px-6 py-4 font-semibold shadow-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:shadow-xl ${isHovering && !isLoading ? 'scale-105 shadow-2xl' : 'scale-100'} ${isLoading ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} border border-gray-200 hover:border-gray-300 focus:ring-4 focus:ring-purple-300/50 focus:outline-none disabled:hover:scale-100 disabled:hover:border-gray-200 disabled:hover:bg-white`}
              >
                <div className="flex items-center space-x-3">
                  {isLoading ? (
                    <Loader2
                      className="h-6 w-6 animate-spin"
                      style={{ color: '#363636' }}
                    />
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span
                    className="text-lg font-semibold"
                    style={{ color: '#363636' }}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
                  </span>
                </div>
              </button>

              <p className="text-center text-xs leading-relaxed text-gray-500">
                Al continuar, aceptas nuestros términos de servicio y política
                de privacidad
              </p>
            </div>
          </div>

          {/* Características destacadas */}
          {!isMobile && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-600/50 p-4 text-center backdrop-blur-sm">
                <div className="mb-2 text-blue-400">
                  <Film size={24} className="mx-auto" />
                </div>
                <p className="text-sm font-medium text-gray-300">Películas</p>
                <p className="text-xs text-gray-500">Organiza tu colección</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-600/50 p-4 text-center backdrop-blur-sm">
                <div className="mb-2 text-green-400">
                  <Tv size={24} className="mx-auto" />
                </div>
                <p className="text-sm font-medium text-gray-300">Series</p>
                <p className="text-xs text-gray-500">Episodios y temporadas</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-600/50 p-4 text-center backdrop-blur-sm">
                <div className="mb-2 text-purple-400">
                  <Music size={24} className="mx-auto" />
                </div>
                <p className="text-sm font-medium text-gray-300">Música</p>
                <p className="text-xs text-gray-500">Biblioteca personal</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gradiente inferior */}
      <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  )
}

export default LoginPage
