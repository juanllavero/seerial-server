import BaseLayout from '@/layouts/BaseLayout'
import { getToken } from '@/lib/auth'
import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'
import { memo } from 'react'

export const RootRoute = createRootRoute({
  component: memo(Root),
  beforeLoad: ({ location }) => {
    console.log(`Root:beforeLoad [${new Date().toISOString()}]: `, {
      pathname: location.pathname,
    })
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
