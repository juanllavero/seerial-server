import { useIsMobile } from '@/components/hooks/use-mobile'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import AlbumContent from '../components/AlbumContent'
import '../DetailsPage.css'
import AlbumInfo from './components/AlbumInfo'
import { useIsTablet } from '@/components/hooks/use-tablet'

function AlbumDetailsPage() {
  const { albumId } = useParams()
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const serverIP = useServerStore((state) => state.serverIP)
  const setCurrentBackground = useDataStore(
    (state) => state.setCurrentBackground,
  )

  // Get series data
  const {
    data: album,
    isLoading,
    error,
    mutate,
  } = useSWR<Album>(`http://${serverIP}/details/album?id=${albumId}`, fetcher)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  useEffect(() => {
    if (album) {
      setCurrentBackground(album.coverSrc)
    }
  }, [album])

  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_ALBUM) {
      mutate()
    }
  }, [wsMessage, mutate])

  if (error) {
    return <NotFound />
  }

  return (
    <FlexBox
      className={`details-container`}
      direction={!isMobile && !isTablet ? 'row' : 'column'}
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 0 5rem 0'}
      align="center"
      width={'100%'}
      height={'100%'}
      css={{ overflowY: !isMobile && !isTablet ? 'hidden' : 'scroll' }}
    >
      <AlbumInfo isLoading={isLoading} album={album} />

      {/* Album Content */}
      {isLoading || !album ? (
        <Skeleton className="h-300 w-200" />
      ) : (
        <AlbumContent album={album} />
      )}
    </FlexBox>
  )
}

export default AlbumDetailsPage
