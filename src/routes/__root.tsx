import { useServerStore } from '@/context/server.context'
import BaseLayout from '@/layouts/BaseLayout'
import { Outlet, useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

function Root() {
  const navigate = useNavigate()
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )

  if (!user && window.location.pathname !== '/users') {
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
