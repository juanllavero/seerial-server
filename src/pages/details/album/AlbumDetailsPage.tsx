import { useIsMobile } from '@/components/hooks/use-mobile'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import { useParams } from '@tanstack/react-router'
import { t } from 'i18next'
import { Edit, Ellipsis } from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import AlbumContent from '../components/AlbumContent'
import '../DetailsPage.css'

function AlbumDetailsPage() {
  const { albumId } = useParams({ from: '/details/album/$albumId' })
  const { wsMessage } = useWebSocketStore()
  const { selectedServer } = useServerStore()
  const { selectSong } = useDataStore()

  // Get series data
  const {
    data: album,
    isLoading,
    mutate,
  } = useSWR<Album>(
    albumId && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${albumId}`
      : null,
    fetcher,
  )

  const isMobile = useIsMobile()

  const [currentPoster, setCurrentPoster] = useState<string | undefined>()
  const [nextPoster, setNextPoster] = useState<string | undefined>()
  const [showAnimPoster, setShowAnimPoster] = useState(false)

  const posterUrl = album?.coverSrc

  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_ALBUM) {
      mutate()
    }
  }, [wsMessage])

  useEffect(() => {
    setNextPoster(posterUrl)
    setShowAnimPoster(true)

    setTimeout(() => {
      setCurrentPoster(posterUrl)
      setTimeout(() => {
        setShowAnimPoster(false)
      }, 100)
    }, 1000)
  }, [posterUrl])

  if (isLoading) {
    return <Loading />
  }

  if (!album) {
    return <NotFound />
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '10rem 0' : '10rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            <FlexBox className="image-container">
              <LazyImage
                url={currentPoster}
                width={350}
                maxHeight={300}
                height={300}
                errorSrc={'/img/songDefault.png'}
              />
            </FlexBox>

            {showAnimPoster && (
              <FlexBox className="image-container-animated fade-in">
                <LazyImage
                  url={nextPoster}
                  width={350}
                  maxHeight={300}
                  height={300}
                  errorSrc={'/img/songDefault.png'}
                />
              </FlexBox>
            )}
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          <span
            id="details-title-music"
            style={{
              textTransform: 'capitalize',
            }}
          >
            {album.title}
          </span>
          <span
            id="details-subtitle-music"
            style={{
              textTransform: 'capitalize',
            }}
          >
            {/* {collection.name} */}
          </span>
          <FlexBox direction="column" gap={0.2}>
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">
                {album.year ? new Date(album.year).getFullYear() : null}
              </span>
            </FlexBox>
            <span id="genres">
              {album.genres ? album.genres.join(', ') || '' : ''}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <Button
              onClick={() => {
                if (album.songs && album.songs.length > 0)
                  selectSong(album.songs[0].id)
              }}
            >
              <FlexBox align="center" gap={0.5} className="text-black">
                <PlayIcon color="#111111" />
                {t('playButton')}
              </FlexBox>
            </Button>
            <Button variant={'ghost'} title={t('editButton')}>
              <Edit />
            </Button>
            <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button>
          </FlexBox>
          <FlexBox>
            <span className="font-semibold">
              {album.description || t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      <AlbumContent album={album} />
    </FlexBox>
  )
}

export default AlbumDetailsPage
