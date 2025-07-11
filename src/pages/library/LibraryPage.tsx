import { useServerStore } from '@/context/server.context'
import { memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { libraryId, type } = useParams()
  const serverUrl = useServerStore((state) => state.serverUrl)

  // Memoize serverUrl
  const ip = useMemo(() => serverUrl, [serverUrl])

  return (
    <LibraryPageContent
      libraryId={libraryId ?? ''}
      serverUrl={ip ?? ''}
      type={type ?? ''}
    />
  )
}

export default memo(LibraryPage)
