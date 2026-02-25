import { useServerStore } from '@/context/auth.store'
import BaseLayout from '@/layouts/BaseLayout'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

const PUBLIC_PATHS = ['/login', '/link']

function Root() {
  const location = useLocation()
  const { user, server } = useServerStore(
    (state) => ({ user: state.currentUser, server: state.selectedServer }),
    shallow,
  )

  const isPublic = PUBLIC_PATHS.includes(location.pathname)

  if (!user || !server) {
    if (!isPublic) return <Navigate to="/login" replace />
    return <Outlet />
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
