import type { Song } from '@seerial/domain';
import { ListMusic } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { useIsTablet } from '@/components/hooks/use-tablet';
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner';
import { Button } from '@/components/ui/button';
import FlexBox from '@/components/ui/FlexBox';
import { PauseIcon, PlayIcon } from '@/components/ui/IconLibrary';
import { useMusicStore } from '@seerial/stores';
import { formatTime, showToast } from '@/utils/ReactUtils';
import MusicWave from './MusicWave';

interface MusicCardProps {
  index: number;
  song: Song;
  handlePlaySong: (song: Song) => void;
}

function MusicCard({ index, song, handlePlaySong }: MusicCardProps) {
  const { t } = useTranslation();
  const { currentSong, isPlaying, isLoading, addToQueue } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      addToQueue: state.addSong,
    }),
    shallow,
  );
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const artists = song.artists.join(', ');

  return (
    <FlexBox
      key={index}
      className={`hover:bg-black/40 ${currentSong?.id === song.id ? '' : ''}`}
      justify="space-between"
      align="center"
      gap={1}
      padding="1rem 0.8rem"
      width={'100%'}
      css={{ borderRadius: '5px', maxWidth: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isMobile || isTablet) {
          handlePlaySong(song);
        }
      }}
    >
      <FlexBox gap={1} align="center">
        {!isMobile && (
          <FlexBox justify="center" align="center" css={{ width: '2rem', cursor: 'pointer' }}>
            {isHovered ? (
              <div
                onClick={() => {
                  if (!isTablet) {
                    handlePlaySong(song);
                  }
                }}
              >
                {isLoading ? (
                  <SmallSpinner />
                ) : isPlaying && currentSong?.id === song.id ? (
                  <PauseIcon size={20} />
                ) : (
                  <PlayIcon size={20} />
                )}
              </div>
            ) : currentSong === song && isPlaying ? (
              <MusicWave />
            ) : (
              <span
                style={{
                  color: currentSong === song ? 'var(--app-color)' : 'lightgray',
                }}
              >
                {index + 1}
              </span>
            )}
          </FlexBox>
        )}
        <FlexBox direction="column" gap={0.2}>
          <span
            className="font-semibold"
            style={{ color: currentSong === song ? 'var(--app-color)' : '' }}
          >
            {song.title}
          </span>
          <FlexBox gap={1} align="center" className="items-center">
            <span className="self-center text-sm text-gray-400">{artists}</span>
          </FlexBox>
        </FlexBox>
      </FlexBox>
      <div
        className="flex items-center space-x-2"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <span>{formatTime(song.duration)}</span>
        {!isMobile && !isTablet && (
          <div className="h-10 w-10">
            {isHovered && (
              <Button
                variant={'ghost'}
                size="icon"
                title={t('addToQueue')}
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(song);
                  showToast('success', t('addedToQueue'), '', 2000, 'top-right');
                }}
              >
                <ListMusic />
              </Button>
            )}
          </div>
        )}
      </div>
    </FlexBox>
  );
}

export default MusicCard;
