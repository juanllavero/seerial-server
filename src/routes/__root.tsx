import { useAuth } from '@/context/auth.context'
import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { CENTRAL_SERVER } from '@/utils/constants'
import { showToast } from '@/utils/ReactUtils'
import { useEffect } from 'react'
import {
  Navigate,
  Outlet,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

function Root() {
  const token = getToken()
  const [searchParams] = useSearchParams()
  const { isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const claimToken = searchParams.get('token')

    // If the user is logged in and has a claim token, we need to send it to the server
    if (!isLoading && token && claimToken) {
      const completeClaim = async () => {
        try {
          const res = await fetch(`https://${CENTRAL_SERVER}/claim/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Use the user token to authenticate the request
            },
            body: JSON.stringify({ claim_token: claimToken }),
          })

          if (res.ok) {
            showToast('success', 'Server registered successfully.')
          } else {
            showToast('error', 'Server registration failed.')
          }
        } catch (error) {
          showToast(
            'error',
            'Conection error with the server. Please try again.',
          )
        } finally {
          // Clear the claim token from the URL
          navigate(window.location.pathname, { replace: true })
        }
      }

      completeClaim()
    }
  }, [token, searchParams, navigate, isLoading])

  if (!token && window.location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (token && window.location.pathname === '/login') {
    return <Navigate to="/home" replace />
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
