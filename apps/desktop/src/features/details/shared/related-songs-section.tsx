import { type Album, formatTime, type Song } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import AnimatedSoundBars from '@/features/music-player/animated-sound-bars';
import { NavigationButton, NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle, Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';

const MAX_RANDOM_SONGS = 6;

interface SongWithAlbum extends Song {
  album: Album;
}

interface RelatedSongsSectionProps {
  albums: Album[];
  focusedElementId?: string;
  onSongFocus?: (songId: string) => void;
  onArrowPress?: (direction: string) => boolean | undefined;
}

function pickRandomSongs(albums: Album[], count: number): SongWithAlbum[] {
  const allSongs: SongWithAlbum[] = albums.flatMap((album) =>
    (album.songs ?? []).map((song) => ({ ...song, album })),
  );

  if (allSongs.length <= count) return allSongs;

  const shuffled = [...allSongs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function RelatedSongsSection({
  albums,
  focusedElementId,
  onSongFocus,
  onArrowPress,
}: RelatedSongsSectionProps) {
  const { t } = useTranslation();
  const { currentSong, isPlaying, setPlaybackContext } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      setPlaybackContext: state.setPlaybackContext,
    }),
    shallow,
  );

  const randomSongs = useMemo(() => pickRandomSongs(albums, MAX_RANDOM_SONGS), [albums]);

  if (randomSongs.length === 0) return null;

  return (
    <FlexBox direction="column" gap={1} width="100%">
      <ListTitle>{t('music')}</ListTitle>

      <NavigationScrollView
        direction="horizontal"
        className="z-10 w-full min-w-0 gap-3"
        scrollMode="center"
        focusedElementId={focusedElementId}
        isRestoringFocus={false}
      >
        {randomSongs.map((song) => {
          const queue = song.album.songs ?? [];
          const isCurrent = currentSong?.id === song.id;

          return (
            <NavigationButton
              key={song.id}
              customKey={`related-song-${song.id}`}
              className="shrink-0 w-[25vh] justify-start rounded-xl! py-8! px-12!"
              onClick={() => setPlaybackContext(song, song.album, queue)}
              onFocus={() => onSongFocus?.(song.id ?? '')}
              onArrowPress={onArrowPress}
            >
              <FlexBox direction="column" gap={0.2} width="100%" className="overflow-hidden">
                <FlexBox gap={1} align="center" width="100%">
                  {isCurrent && <AnimatedSoundBars isPlaying={isPlaying} />}
                  <Tertiary className="text-current! truncate">{song.title}</Tertiary>
                </FlexBox>
                <Tertiary className="text-current! truncate opacity-60 text-[1.5vh]!">
                  {song.album.title}
                  {song.duration ? ` · ${formatTime(song.duration)}` : ''}
                </Tertiary>
              </FlexBox>
            </NavigationButton>
          );
        })}
      </NavigationScrollView>
    </FlexBox>
  );
}

export default memo(RelatedSongsSection);
