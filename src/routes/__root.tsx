import { useServerStore } from '@/context/server.context'
import BaseLayout from '@/layouts/BaseLayout'
import { Outlet, useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

function Root() {
  const navigate = useNavigate()
  const { server, user } = useServerStore(
    (state) => ({
      server: state.server,
      user: state.currentUser,
    }),
    shallow,
  )

  if (!server && window.location.pathname !== '/login') {
    navigate('/login')
    return null
  }

  if (
    !user &&
    window.location.pathname !== '/users' &&
    window.location.pathname !== '/login'
  ) {
    navigate('/users')
    return null
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}

export default Root
