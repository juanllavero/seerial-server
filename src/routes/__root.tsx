import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'

export const RootRoute = createRootRoute({
  component: Root,
  beforeLoad: ({ location }) => {
    const token = getToken()
    if (!token && location.pathname !== '/login') {
      throw redirect({ to: '/login' })
    }
  },
})

function Root() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  )
}
