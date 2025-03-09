import { createBrowserHistory, createRouter } from '@tanstack/react-router'
import { rootTree } from './routes'

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const history = createBrowserHistory()
export const router = createRouter({ routeTree: rootTree, history: history })
