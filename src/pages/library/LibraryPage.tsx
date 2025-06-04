import { useServerStore } from '@/context/server.context'
import { useLoaderData, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { server } = useLoaderData({ from: '/server/$serverId' })
  const { libraryId } = useParams({
    from: '/server/$serverId/library/$libraryId',
  })
  const { selectServer, selectedServer } = useServerStore()

  useEffect(() => {
    if (server !== selectedServer) {
      selectServer(server)
    }
  }, [])

  return <LibraryPageContent libraryId={libraryId} serverIP={server.ip} />
}

export default LibraryPage
