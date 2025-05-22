import { useAuth } from '@/context/auth.context'
import { CredentialResponse, GoogleLogin } from '@react-oauth/google'

const Login = () => {
  const { login } = useAuth()

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential
    if (!credential) {
      alert('No se recibió el token de Google')
      return
    }

    try {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        await login(data.token)
      } else {
        alert(data.error || 'Login fallido')
      }
    } catch (error) {
      alert('Error conectando con el servidor')
      console.error(error)
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleLogin}
      onError={() => alert('Error al iniciar sesión con Google')}
      text="continue_with"
      theme="filled_black"
    />
  )
}

export default Login
