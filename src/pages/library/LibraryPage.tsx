import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import useSWR from 'swr'
import AlbumList from './components/lists/AlbumList'
import MoviesList from './components/lists/MoviesList'
import SeriesList from './components/lists/SeriesList'

function LibraryPage() {
  const { libraryId } = useParams({ from: '/library/$libraryId' })
  const { selectedServer } = useServerStore()
  const { wsMessage } = useWebSocketStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const {
    data: library,
    isLoading,
    mutate,
  } = useSWR<Library>(
    libraryId && selectedServer
      ? `https://${selectedServer.ip}/library?id=${libraryId}`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (library) {
      selectLibrary(library.id)
    }
  }, [library])

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_LIBRARY) {
      mutate()
    }
  }, [wsMessage])

  if (libraryId !== selectedLibraryId) {
    if (library) {
      selectLibrary(library.id)
    } else {
      return <NotFound />
    }
  }

  if (!library || isLoading) {
    return <Loading />
  }

  const ItemsList = () =>
    library?.type === 'Music' ? (
      <AlbumList library={library} />
    ) : library?.type === 'Shows' ? (
      <SeriesList library={library} />
    ) : (
      <MoviesList library={library} />
    )

  if (isTablet || isMobile) {
    return (
      <Grid
        columns={isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'}
        gap="1rem"
        padding="8rem 1rem"
        height={'100%'}
        scroll="vertical"
        justifyContent="start"
        alignItems="start"
        hideScrollbar
      >
        <ItemsList />
      </Grid>
    )
  }

  return (
    <FlexBox
      gap={1}
      wrap="wrap"
      padding="8rem 2rem"
      scroll="vertical"
      height={'100%'}
    >
      <ItemsList />
    </FlexBox>
  )
}

export default LibraryPage
