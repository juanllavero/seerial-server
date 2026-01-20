import { API, authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Library } from '@/data/interfaces/Media'
import { useCardWidth } from '@/hooks/useCardWidth'
import NoContent from '@/pages/home/components/NoContent'
import { memo, useEffect } from 'react'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import LibraryContent from './LibraryContent'
import LibraryPageSkeleton from './LibraryPageSkeleton'

interface LibraryPageContentProps {
  libraryId: string
  type: string
}

function LibraryPageContent({ libraryId, type }: LibraryPageContentProps) {
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const { cardWidth } = useCardWidth()
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  )
  const {
    data: library,
    isLoading,
    mutate,
  } = useSWR<Library>(API.libraries.getById(libraryId), authenticatedFetcher)

  useEffect(() => {
    if (
      (wsMessage?.header === MessageType.MUTATE_LIBRARY ||
        wsMessage?.header === MessageType.SCAN_COMPLETE ||
        wsMessage?.header === MessageType.MUTATE_COLLECTION ||
        wsMessage?.header === MessageType.MUTATE_MOVIE ||
        wsMessage?.header === MessageType.MUTATE_SERIES ||
        wsMessage?.header === MessageType.MUTATE_ALBUM) &&
      wsMessage.body.libraryId === libraryId
    ) {
      console.log('Updating all')
      mutate()
    }
    console.log('Message recieved but no mutation')
  }, [wsMessage, mutate])

  useEffect(() => {
    if (library && library.id !== selectedLibraryId) {
      selectLibrary(library.id)
    }
  }, [library?.id, selectedLibraryId, selectLibrary])

  if (isLoading) {
    return <LibraryPageSkeleton cardWidth={cardWidth} type={type} />
  }

  if (!library) {
    return <NoContent />
  }

  return <LibraryContent library={library} mutateLibrary={mutate} />
}

export default memo(LibraryPageContent)
