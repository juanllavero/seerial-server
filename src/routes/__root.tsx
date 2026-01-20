import { useServerStore } from '@/context/server.context'
import BaseLayout from '@/layouts/BaseLayout'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

function Root() {
  const location = useLocation()
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )

  if (!user && location.pathname !== '/users') {
    return <Navigate to="/users" replace />
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
