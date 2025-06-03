import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import CardGridSkeleton from '@/components/skeletons/CardGridSkeleton'
import Grid from '@/components/ui/Grid'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useLoaderData, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import useSWR from 'swr'
import AlbumList from './components/lists/AlbumList'
import MoviesList from './components/lists/MoviesList'
import SeriesList from './components/lists/SeriesList'
import { useCardWidth } from '@/hooks/useCardWidth'

function LibraryPage() {
  const { server } = useLoaderData({ from: '/server/$serverId' })
  const { libraryId } = useParams({
    from: '/server/$serverId/library/$libraryId',
  })
  const { cardWidth } = useCardWidth()
  const { serverStatus, selectServer } = useServerStore()
  const { wsMessage } = useWebSocketStore()
  const { selectLibrary } = useDataStore()
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  console.log('Here')

  useEffect(() => {
    if (server) {
      selectServer(server)
    }
  }, [server, selectServer])

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
  }, [wsMessage, mutate])

  const getCardWidth = () => {
    const baseWidth = cardWidth * 0.8
    if (isMobile) return Math.max(baseWidth * 0.8, 120)
    if (isTablet) return Math.max(baseWidth * 0.9, 150)
    return Math.max(baseWidth, 180)
  }

  const finalCardWidth = getCardWidth()

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

  return (
    <Grid
      columns={
        isMobile || isTablet
          ? `repeat(auto-fit, minmax(${cardWidth}px, 1fr))`
          : `repeat(auto-fit, minmax(${cardWidth * 0.8}px, ${cardWidth * 1.2}px))`
      }
      gap="1rem"
      padding={isMobile ? '1rem' : '2rem'}
      scroll="vertical"
      justifyContent="start"
      alignItems="start"
      hideScrollbar
    >
      <ItemsList />
    </Grid>
  )
}

export default LibraryPage
