import { useServerStore } from '@/context/server.context'
import { memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { libraryId, type } = useParams()
  const serverIP = useServerStore((state) => state.serverIP)

  // Memoize serverIP
  const ip = useMemo(() => serverIP, [serverIP])

  return (
    <LibraryPageContent
      libraryId={libraryId ?? ''}
      serverIP={ip ?? ''}
      type={type ?? ''}
    />
  )
}

export default memo(LibraryPage)
