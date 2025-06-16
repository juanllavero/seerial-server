import { useIsMobile } from '@/components/hooks/use-mobile'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import { Edit, Ellipsis } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import AlbumContent from '../components/AlbumContent'
import '../DetailsPage.css'

function AlbumDetailsPage() {
  const { albumId } = useParams()
  const { wsMessage } = useWebSocketStore()
  const { openAlbumDialog } = useDialogStore()
  const { selectedServer } = useServerStore()
  const { selectSong } = useDataStore()
  const serverIP = selectedServer?.ip

  // Get series data
  const {
    data: album,
    isLoading,
    error,
    mutate,
  } = useSWR<Album>(`https://${serverIP}/details/album?id=${albumId}`, fetcher)

  const isMobile = useIsMobile()

  // Update selected server
  // useEffect(() => {
  //   if (server !== selectedServer) {
  //     selectServer(server)
  //   }
  // }, [])

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
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 3rem 5rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            <FlexBox className="image-container">
              {isLoading || !album ? (
                <Skeleton style={{ width: '300px', height: '350px' }} />
              ) : (
                <LazyImage
                  url={album.coverSrc}
                  width={350}
                  maxHeight={300}
                  height={300}
                  errorSrc={'/img/songDefault.png'}
                />
              )}
            </FlexBox>
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
            {isLoading || !album ? (
              <Skeleton className="h-15 w-90" />
            ) : (
              album.title
            )}
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
                {isLoading || !album ? (
                  <Skeleton className="h-5 w-20" />
                ) : album.year ? (
                  new Date(album.year).getFullYear()
                ) : null}
              </span>
            </FlexBox>
            <span id="genres">
              {isLoading || !album ? (
                <Skeleton className="h-5 w-40" />
              ) : album.genres ? (
                album.genres.join(', ') || ''
              ) : (
                ''
              )}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <Button
              onClick={() => {
                if (album && album.songs && album.songs.length > 0)
                  selectSong(album.songs[0].id)
              }}
            >
              <FlexBox align="center" gap={0.5} className="text-black">
                <PlayIcon color="#111111" />
                {t('playButton')}
              </FlexBox>
            </Button>
            <Button
              variant={'ghost'}
              title={t('editButton')}
              onClick={() => {
                if (album) {
                  openAlbumDialog(album)
                }
              }}
            >
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
              {isLoading || !album ? (
                <Skeleton className="h-30 w-90" />
              ) : (
                album.description || ''
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

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
