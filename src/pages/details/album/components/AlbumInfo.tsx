import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'
import { useDialogStore } from '@/context/dialog.context'
import useMusicStore from '@/context/music.context'
import { Album, Song } from '@/data/interfaces/Music'
import { Edit, Ellipsis } from 'lucide-react'
import Image from '@/components/ui/Image'
import { useTranslation } from 'react-i18next'
import { PauseIcon, PlayIcon } from '@/components/ui/IconLibrary'

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
      className={`${!isMobile && !isTablet ? 'w-250 max-w-250 min-w-250 flex-1' : ''}`}
      gap={2}
    >
      {/* Cover Image */}
      <div className="cover-container">
        <FlexBox className="image-container">
          {isLoading || !album ? (
            <Skeleton className="h-100 w-100" />
          ) : (
            <div className={`${!isMobile ? 'h-100 w-100' : ''}`}>
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
        <FlexBox gap={1} wrap="wrap" justify="center" align="center">
          <Button
            variant={'ghost'}
            title={t('editButton')}
            className="rounded-full"
            onClick={() => {
              if (album) {
                openAlbumDialog(album)
              }
            }}
          >
            <Edit />
          </Button>
          <Button
            className="h-15 rounded-full"
            onClick={() => {
              if (isShown) {
                togglePlayPause()
              } else if (album && album.songs && album.songs.length > 0) {
                selectSong(album.songs[0])
              }
            }}
          >
            {isPlaying ? (
              <PauseIcon color="#111111" size={30} />
            ) : (
              <PlayIcon color="#111111" size={30} />
            )}
          </Button>
          <Button
            variant={'ghost'}
            className="rounded-full"
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
