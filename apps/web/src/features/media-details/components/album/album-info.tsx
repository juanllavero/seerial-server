import type { Album, Song } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useMusicStore } from '@seerial/stores';
import { Pencil, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import useScreenHeight from '@/shared/hooks/use-height';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { getCoverSize, getTitleSize } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { PauseIcon, PlayIcon } from '@/shared/ui/icon-library';
import Image from '@/shared/ui/image';
import { Skeleton } from '@/shared/ui/skeleton';
import SmallSpinner from '@/shared/ui/small-spinner';

interface AlbumInfoProps {
  isLoading: boolean;
  album: Album;
}

function AlbumInfo({ isLoading, album }: AlbumInfoProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isAdmin = useIsAdmin();
  const screenHeight = useScreenHeight();
  const {
    isPlaying,
    isLoaidng: loadingSong,
    isShown,
    togglePlayPause,
    selectSong,
    setSongQueue,
    setIsShown,
  } = useMusicStore(
    (state) => ({
      isPlaying: state.isPlaying,
      isLoaidng: state.isLoading,
      isShown: state.isShown,
      togglePlayPause: state.togglePlayPause,
      selectSong: state.selectSong,
      setSongQueue: state.setSongQueue,
      setIsShown: state.setIsShown,
    }),
    shallow,
  );
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);

  const getTotalDuration = (songs: Song[]) => {
    return songs.reduce((acc, song) => acc + song.duration / 60, 0).toFixed(0);
  };

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
              className={`${isMobile ? 'h-screen max-h-[55dvw] w-screen max-w-[55dvw]' : getCoverSize(screenHeight, false, false)}`}
            />
          ) : (
            <div
              className={`${isMobile ? 'max-w-[55dvw]' : getCoverSize(screenHeight, false, false)}`}
            >
              <Image
                url={album.coverSrc}
                className={`h-full w-full rounded-2xl object-cover shadow-2xl shadow-black/20`}
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
          {isLoading || !album ? <Skeleton className="h-15 w-90" /> : album.title}
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
          {isAdmin && (
            <Button
              variant={'ghost'}
              title={t('editButton')}
              className="rounded-full"
              onClick={() => openDialog('album', { id: album.id })}
            >
              <Pencil />
            </Button>
          )}
          <Button
            className="h-15 rounded-full"
            onClick={() => {
              if (isShown) {
                togglePlayPause();
              } else if (album && album.songs && album.songs.length > 0) {
                selectSong(album.songs[0]);
                setIsShown(true);
                setSongQueue(album.songs);
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
            onClick={(e) => {
              e.stopPropagation();

              // Shuffle play
              if (album && album.songs && album.songs.length > 0) {
                const randomIndex = Math.floor(Math.random() * album.songs.length);
                selectSong(album.songs[randomIndex]);
                setIsShown(true);
                setSongQueue([...album.songs].sort(() => Math.random() - 0.5));
              }
            }}
          >
            <Shuffle />
          </Button>
        </FlexBox>
        <FlexBox>
          <span className="font-semibold">
            {isLoading || !album ? <Skeleton className="h-30 w-90" /> : album.description || ''}
          </span>
        </FlexBox>
      </FlexBox>
    </FlexBox>
  );
}

export default AlbumInfo;
