import { createBrowserHistory, createRouter } from 'react-router-dom'
import { rootTree } from './routes'

declare module 'react-router-dom' {
  interface Register {
    router: typeof router
  }
}

const history = createBrowserHistory()
export const router = createRouter({ routeTree: rootTree, history: history })
