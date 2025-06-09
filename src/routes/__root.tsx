import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { Navigate, Outlet } from 'react-router-dom'
import { memo } from 'react'

function Root() {
  const token = getToken()

  if (!token && window.location.pathname !== '/login') {
    console.log(`Root:check [${new Date().toISOString()}]: `, {
      pathname: window.location.pathname,
    })
    return <Navigate to="/login" replace />
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default memo(Root)
