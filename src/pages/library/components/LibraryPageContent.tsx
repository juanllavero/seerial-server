import useDataStore from '@/context/data.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Library } from '@/data/interfaces/Media'
import { useCardWidth } from '@/hooks/useCardWidth'
import NoContent from '@/pages/home/components/NoContent'
import { fetcher } from '@/utils/utils'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import LibraryContent from './LibraryContent'
import LibraryPageSkeleton from './LibraryPageSkeleton'
import { shallow } from 'zustand/shallow'

interface LibraryPageContentProps {
  libraryId: string
  serverIP: string
  type: string
}

function LibraryPageContent({
  libraryId,
  serverIP,
  type,
}: LibraryPageContentProps) {
  const { cardWidth } = useCardWidth()
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
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
    return <LibraryPageSkeleton cardWidth={cardWidth} type={type} />
  }

  if (!memoizedLibrary) {
    return <NoContent />
  }

  return <LibraryContent library={memoizedLibrary} mutateLibrary={mutate} />
}

export default LibraryPageContent
