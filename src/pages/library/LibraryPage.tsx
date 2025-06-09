import { useServerStore } from '@/context/server.context'
import { useParams } from 'react-router-dom'
import { memo, useMemo } from 'react'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { libraryId } = useParams()
  const { selectedServer } = useServerStore()

  // Memoize serverIP
  const serverIP = useMemo(() => selectedServer?.ip, [selectedServer?.ip])

  console.log(`LibraryPage [${new Date().toISOString()}]: `, {
    libraryId,
    serverIP,
    serverId: selectedServer?.id,
  })

  return (
    <LibraryPageContent libraryId={libraryId ?? ''} serverIP={serverIP ?? ''} />
  )
}

export default memo(LibraryPage)
