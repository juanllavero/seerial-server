import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'
import { API } from '@/config/api'
import { useGradientStore } from '@/context/gradientBackground.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Album } from '@/data/interfaces/Music'
import { useGet } from '@/hooks/media/useGet'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import AlbumContent from '../components/AlbumContent'
import '../DetailsPage.css'
import AlbumInfo from './components/AlbumInfo'

function AlbumDetailsPage() {
  const { albumId } = useParams()
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const selectBackground = useGradientStore((state) => state.selectBackground)

  // Get series data
  const {
    data: album,
    isLoading,
    error,
    mutate,
  } = useGet<Album>(API.albums.get(albumId ?? ''))

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  useEffect(() => {
    if (album) {
      selectBackground(album.coverSrc)
    }
  }, [album])

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
