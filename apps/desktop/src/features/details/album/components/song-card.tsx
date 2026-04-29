import { formatTime, type Song } from '@seerial/domain';
import { memo } from 'react';
import { AnimatedSoundBars } from '@/features/music-player';
import { NavigationButton } from '@/shared/components/navigation';
import { Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';

interface SongCardProps {
  song: Song;
  currentSongId?: string;
  focusedSongId?: string;
  isPlaying: boolean;
  onClick: () => void;
  onFocus: () => void;
  onNavigateToRelated?: () => void;
}

function SongCard({
  song,
  currentSongId,
  focusedSongId,
  isPlaying,
  onClick,
  onFocus,
  onNavigateToRelated,
}: SongCardProps) {
  const isCurrentSong = currentSongId === song.id;

  return (
    <NavigationButton
      customKey={song.id}
      className="w-full justify-start rounded-xl! py-[4dvh]!"
      onClick={onClick}
      onFocus={onFocus}
      onArrowPress={
        onNavigateToRelated
          ? (direction) => {
              if (direction === 'right') {
                onNavigateToRelated();
                return false;
              }
              return true;
            }
          : undefined
      }
    >
      <FlexBox justify="space-between" padding="0 1.5rem" width={'100%'}>
        <FlexBox gap={1.5} items="center" justify="center" className="relative">
          <FlexBox justify="center" items="center" width={'1dvh'}>
            {isCurrentSong ? (
              <AnimatedSoundBars
                isPlaying={isPlaying}
                isSelected={focusedSongId === song.id}
                translate={false}
              />
            ) : (
              <Tertiary className="text-current!">{song.trackNumber}</Tertiary>
            )}
          </FlexBox>
          <Tertiary className="text-current! truncate max-w-[70dvh]">{song.title}</Tertiary>
        </FlexBox>
        <Tertiary className="text-current!">
          {song.duration ? formatTime(song.duration) : ''}
        </Tertiary>
      </FlexBox>
    </NavigationButton>
  );
}

export default memo(SongCard);
