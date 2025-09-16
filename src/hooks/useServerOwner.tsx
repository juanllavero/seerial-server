import { useAuth } from '@/context/auth.context'
import { useServerStore } from '@/context/server.context'
import { Server } from '@/data/interfaces/Users'

export function useIsServerOwner(server?: Server) {
  const { isServerOwner } = useAuth()
  const selectedServer = useServerStore((state) => state.selectedServer)

  const targetServer = server ?? selectedServer

  return targetServer ? (isServerOwner(targetServer) ?? false) : false
}
