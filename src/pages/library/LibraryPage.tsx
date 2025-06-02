import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import CardGridSkeleton from '@/components/skeletons/CardGridSkeleton'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useLoaderData, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import useSWR from 'swr'
import AlbumList from './components/lists/AlbumList'
import MoviesList from './components/lists/MoviesList'
import SeriesList from './components/lists/SeriesList'

function LibraryPage() {
  const navigate = useNavigate()
  const { server } = useLoaderData({ from: '/server/$serverId' })
  const { libraryId } = useParams({
    from: '/server/$serverId/library/$libraryId',
  })
  const { serverStatus, selectServer } = useServerStore()
  const { wsMessage } = useWebSocketStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const cardWidth = Number(localStorage.getItem('cardWidth')) || 200

  if (server) {
    selectServer(server)
  }

  const {
    data: library,
    isLoading,
    mutate,
  } = useSWR<Library>(
    libraryId && server && serverStatus
      ? `https://${server.ip}/library?id=${libraryId}`
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

  // if (libraryId !== selectedLibraryId) {
  //   if (library) {
  //     selectLibrary(library.id)
  //   } else {
  //     return <NotFound />
  //   }
  // }

  // if (!server || !serverStatus) {
  //   navigate({ to: '/' })
  //   return null
  // }

  if (!library || isLoading) {
    return <CardGridSkeleton cards={12} width={cardWidth} aspectRatio={3 / 2} />
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
        padding="1rem"
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
      padding="2rem"
      scroll="vertical"
      height={'100%'}
    >
      <ItemsList />
    </FlexBox>
  )
}

export default LibraryPage
