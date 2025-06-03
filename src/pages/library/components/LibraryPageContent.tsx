import { Library } from '@/data/interfaces/Media'
import { useCardWidth } from '@/hooks/useCardWidth'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import LibraryContent from './LibraryContent'
import LibraryPageSkeleton from './LibraryPageSkeleton'
import { MessageType } from '@/data/enums/WSMessage'
import { useEffect } from 'react'
import useDataStore from '@/context/data.context'
import { useWebSocketStore } from '@/context/ws.context'

interface LibraryPageContentProps {
  libraryId: string
  serverIP: string
}

function LibraryPageContent({ libraryId, serverIP }: LibraryPageContentProps) {
  const { cardWidth } = useCardWidth()
  const { wsMessage } = useWebSocketStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()
  const {
    data: library,
    isLoading,
    mutate,
  } = useSWR<Library>(`https://${serverIP}/library?id=${libraryId}`, fetcher)

  console.log('Content')

  useEffect(() => {
    if (library && library.id !== selectedLibraryId) {
      selectLibrary(library.id)
    }
  }, [library, selectLibrary, selectedLibraryId])

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_LIBRARY) {
      mutate()
    }
  }, [wsMessage, mutate])

  if (!library || isLoading) {
    return <LibraryPageSkeleton cardWidth={cardWidth} />
  }

  return <LibraryContent library={library} />
}

export default LibraryPageContent
