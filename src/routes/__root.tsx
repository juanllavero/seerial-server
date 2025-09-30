import { useServerStore } from '@/context/server.context'
import BaseLayout from '@/layouts/BaseLayout'
import { Navigate, Outlet } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

function Root() {
  const { server, user } = useServerStore(
    (state) => ({
      server: state.server,
      user: state.currentUser,
    }),
    shallow,
  )

  // if (
  //   (!server || !user) &&
  //   window.location.pathname !== '/users' &&
  //   window.location.pathname !== '/login'
  // ) {
  //   return <Navigate to="/users" replace />
  // }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
