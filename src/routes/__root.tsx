import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { memo } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

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
