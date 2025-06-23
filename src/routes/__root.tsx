import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { Navigate, Outlet } from 'react-router-dom'

function Root() {
  const token = getToken()

  if (!token && window.location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
