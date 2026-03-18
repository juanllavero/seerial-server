import { useGetAlbum } from '@seerial/api';
import type { Album } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { formatTime } from '@/shared/lib/react-utils';
import FlexBox from '@/shared/ui/flex-box';
import { PauseIcon, PlayIcon } from '@/shared/ui/icon-library';
import LazyImage from '@/shared/ui/lazy-image';
import SmallSpinner from '@/shared/ui/small-spinner';
import './next-songs.css';

function NextSongs() {
  const { t } = useTranslation();
  const { songQueue, currentSong, selectSong, isPlaying, isLoading, togglePlayPause } =
    useMusicStore(
      (state) => ({
        songQueue: state.songQueue,
        currentSong: state.currentSong,
        selectSong: state.selectSong,
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        togglePlayPause: state.togglePlayPause,
      }),
      shallow,
    );
  const { data: album } = useGetAlbum<Album>(currentSong?.albumId ?? '', {
    enabled: Boolean(currentSong?.albumId),
  });

  if (!album) return null;

  return (
    <FlexBox
      direction="column"
      gap={1}
      scroll="vertical"
      width={'100%'}
      height="100%"
      padding="0 0.5rem"
      className="overflow-x-hidden rounded-lg bg-black"
    >
      <span className="p-2 pb-0 text-2xl font-black">{t('queue')}</span>
      {songQueue.map((item, index) => (
        <FlexBox
          key={index}
          className={`songItem ${currentSong?.id === item.id ? 'activeSong' : ''}`}
          justify="space-between"
          align="center"
          gap={1}
          padding="0.5rem"
          width={'100%'}
          css={{ borderRadius: '5px' }}
        >
          <FlexBox gap={1} align="center">
            <div
              className="imgContainer"
              onClick={() => {
                if (currentSong === item) {
                  togglePlayPause();
                } else {
                  selectSong(item);
                }
              }}
            >
              <LazyImage url={album.coverSrc} aspectRatio="1" height={'2.5rem'} />
              <div className="shadowImage">
                {isLoading ? <SmallSpinner /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
              </div>
            </div>
            <FlexBox direction="column">
              <span className="truncate">{item.title}</span>
              <span>{album.name}</span>
            </FlexBox>
          </FlexBox>
          <span>{formatTime(item.duration)}</span>
        </FlexBox>
      ))}
    </FlexBox>
  );
}

export default NextSongs;
