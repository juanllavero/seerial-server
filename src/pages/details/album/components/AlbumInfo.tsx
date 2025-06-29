import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import { useDialogStore } from '@/context/dialog.context'
import useMusicStore from '@/context/music.context'
import { Album, Song } from '@/data/interfaces/Music'
import { PauseIcon, PlayIcon, Edit, Ellipsis } from 'lucide-react'
import Image from '@/components/ui/Image'
import { useTranslation } from 'react-i18next'

interface AlbumInfoProps {
  isLoading: boolean
  album?: Album
}

function AlbumInfo({ isLoading, album }: AlbumInfoProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { isPlaying, isShown, togglePlayPause, selectSong } = useMusicStore()
  const { openAlbumDialog } = useDialogStore()

  const getTotalDuration = (songs: Song[]) => {
    return songs.reduce((acc, song) => acc + song.duration, 0).toFixed(0)
  }

  return (
    <FlexBox
      direction="column"
      justify="center"
      align="center"
      padding="5rem"
      width={!isMobile && !isTablet ? 'auto' : '100%'}
      gap={2}
    >
      {/* Cover Image */}
      <div className="cover-container">
        <FlexBox className="image-container">
          {isLoading || !album ? (
            <Skeleton style={{ width: '300px', height: '350px' }} />
          ) : (
            <div className="h-100 w-100">
              <Image
                url={album.coverSrc}
                className="h-full w-full rounded-2xl object-cover shadow-2xl shadow-black/20"
                alt="Album Cover Image"
                aspectRatio={1}
                fallbackSrc={'locale/img/songDefault.png'}
              />
            </div>
          )}
        </FlexBox>
      </div>

      {/* Details */}
      <FlexBox
        direction="column"
        justify="center"
        align="center"
        className="text-center"
        gap={1}
        width={isMobile ? '100%' : '80%'}
        padding={isMobile ? '0 2rem' : '0'}
      >
        <span
          className="text-5xl font-black"
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
        <div>
          {isLoading || !album ? (
            <Skeleton className="h-6 w-30" />
          ) : (
            <span>
              {album.year ? new Date(album.year).getFullYear() : null}
              {album.genres ? ' • ' + album.genres.join(', ') : ''}
            </span>
          )}
        </div>
        <div>
          {isLoading || !album ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <span>
              {album.songs.length} {t('songs')}
              {' • '}
              {getTotalDuration(album.songs) || '0'}
              {` ${t('minutes')}`}
            </span>
          )}
        </div>
        <FlexBox gap={1} wrap="wrap">
          <Button
            onClick={() => {
              if (isShown) {
                togglePlayPause()
              } else if (album && album.songs && album.songs.length > 0) {
                selectSong(album.songs[0])
              }
            }}
          >
            <FlexBox align="center" gap={0.5} className="text-black">
              {isPlaying ? (
                <PauseIcon color="#111111" />
              ) : (
                <PlayIcon color="#111111" />
              )}
              {isPlaying ? t('pauseButton') : t('playButton')}
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
  )
}

export default AlbumInfo
