import { useServerStore } from '@/context/server.context'
import { useLoaderData, useParams } from '@tanstack/react-router'
import { memo, useEffect, useMemo } from 'react'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { server } = useLoaderData({ from: '/server/$serverId' })
  const { libraryId } = useParams({
    from: '/server/$serverId/library/$libraryId',
  })
  const { selectServer } = useServerStore()

  // Memoize serverIP
  const serverIP = useMemo(() => server.ip, [server.ip])

  useEffect(() => {
    if (server) {
      console.log('selectServer triggered: ', server.id)
      selectServer(server)
    }
  }, [])

  console.log(`LibraryPage [${new Date().toISOString()}]: `, {
    libraryId,
    serverIP,
    serverId: server.id,
  })

  return <LibraryPageContent libraryId={libraryId} serverIP={serverIP} />
}

export default memo(LibraryPage)
