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
import {
  DolbyAtmosIcon,
  PauseIcon,
  PlayIcon,
} from '@/components/ui/IconLibrary'
import useScreenHeight from '@/components/hooks/use-height'
import { ScreenHeight } from '@/data/enums/Screen'
import { shallow } from 'zustand/shallow'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import { getCoverSize, getTitleSize } from '@/utils/ReactUtils'

interface AlbumInfoProps {
  isLoading: boolean
  album?: Album
}

function AlbumInfo({ isLoading, album }: AlbumInfoProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const screenHeight = useScreenHeight()
  const {
    isPlaying,
    isLoaidng: loadingSong,
    isShown,
    togglePlayPause,
    selectSong,
  } = useMusicStore(
    (state) => ({
      isPlaying: state.isPlaying,
      isLoaidng: state.isLoading,
      isShown: state.isShown,
      togglePlayPause: state.togglePlayPause,
      selectSong: state.selectSong,
    }),
    shallow,
  )
  const openAlbumDialog = useDialogStore((state) => state.openAlbumDialog)

  const getTotalDuration = (songs: Song[]) => {
    return songs.reduce((acc, song) => acc + song.duration / 60, 0).toFixed(0)
  }

  return (
    <FlexBox
      direction="column"
      justify="center"
      align="center"
      padding={isMobile ? '0.5rem' : isTablet ? '2rem' : '5rem'}
      width={!isMobile && !isTablet ? 'auto' : '100%'}
      className={`${!isMobile && !isTablet ? 'w-[50dvw] max-w-[50dvw] min-w-[50dvw] flex-1' : ''}`}
      gap={2}
    >
      {/* Cover Image */}
      <div className="cover-container">
        <FlexBox className="image-container">
          {isLoading || !album ? (
            <Skeleton
              className={`${!isMobile ? getCoverSize(screenHeight, false, false) : 'h-screen max-h-[55dvw] w-screen max-w-[55dvw]'}`}
            />
          ) : (
            <div
              className={`${!isMobile ? getCoverSize(screenHeight, false, false) : 'max-w-[55dvw]'}`}
            >
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
        width={isMobile || isTablet ? '100%' : '80%'}
        padding={'0'}
      >
        <span
          className={`font-black ${getTitleSize(screenHeight, isMobile)}`}
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

        <FlexBox gap={1} justify="center" align="center">
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
            {loadingSong ? (
              <SmallSpinner size={30} />
            ) : isPlaying ? (
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
