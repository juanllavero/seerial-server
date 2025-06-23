import { useServerStore } from '@/context/server.context'
import { memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { libraryId, type } = useParams()
  const { selectedServer } = useServerStore()

  // Memoize serverIP
  const serverIP = useMemo(() => selectedServer?.ip, [selectedServer?.ip])

  console.log(`LibraryPage [${new Date().toISOString()}]: `, {
    libraryId,
    serverIP,
    serverId: selectedServer?.id,
  })

  return (
    <LibraryPageContent
      libraryId={libraryId ?? ''}
      serverIP={serverIP ?? ''}
      type={type ?? ''}
    />
  )
}

export default memo(LibraryPage)
