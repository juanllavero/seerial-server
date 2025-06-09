import { Library } from '@/data/interfaces/Media'
import { useCardWidth } from '@/hooks/useCardWidth'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import LibraryContent from './LibraryContent'
import LibraryPageSkeleton from './LibraryPageSkeleton'
import { MessageType } from '@/data/enums/WSMessage'
import { useEffect, useMemo } from 'react'
import useDataStore from '@/context/data.context'
import { useWebSocketStore } from '@/context/ws.context'
import NoContent from '@/pages/home/components/NoContent'

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

  // Memoize library to prevent unnecessary re-renders
  const memoizedLibrary = useMemo(() => library, [library?.id])

  useEffect(() => {
    if (library && library.id !== selectedLibraryId) {
      console.log('selectLibrary triggered:', {
        libraryId: library.id,
        selectedLibraryId,
      })
      selectLibrary(library.id)
    }
  }, [library?.id, selectedLibraryId, selectLibrary])

  // Mutate content on ws message
  useEffect(() => {
    console.log('wsMessage:', wsMessage)
    if (wsMessage === MessageType.MUTATE_LIBRARY) {
      mutate()
    }
  }, [wsMessage, mutate])

  if (isLoading) {
    return <LibraryPageSkeleton cardWidth={cardWidth} />
    //return <Loading />
  }

  if (!memoizedLibrary) {
    return <NoContent />
  }

  return <LibraryContent library={memoizedLibrary} />
}

export default LibraryPageContent
