import { type Album, formatTime, type Song } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { AnimatedSoundBars } from '@/features/music-player';
import { NavigationButton, NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle, Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';

interface SongWithAlbum extends Song {
  album: Album;
}

interface RelatedSongsSectionProps {
  albums: Album[];
  songs: Song[];
  focusedElementId?: string;
  onSongFocus?: (songId: string) => void;
  onArrowPress?: (direction: string) => boolean | undefined;
}

function RelatedSongsSection({
  albums,
  songs,
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

  const songsWithAlbum = useMemo<SongWithAlbum[]>(() => {
    const albumMap = new Map(albums.map((album) => [album.id, album]));
    return songs.flatMap((song) => {
      const album = albumMap.get(song.albumId);
      return album ? [{ ...song, album }] : [];
    });
  }, [albums, songs]);

  const queueByAlbumId = useMemo(() => {
    const grouped = new Map<string, Song[]>();

    for (const song of songsWithAlbum) {
      const current = grouped.get(song.album.id) ?? [];
      current.push(song);
      grouped.set(song.album.id, current);
    }

    return grouped;
  }, [songsWithAlbum]);

  if (songsWithAlbum.length === 0) return null;

  return (
    <FlexBox direction="column" gap={2} width="40dvw" padding="0 3dvh">
      <ListTitle>{t('music')}</ListTitle>

      <NavigationScrollView
        direction="vertical"
        className="z-10 w-full min-w-0 gap-3"
        scrollMode="center"
        focusedElementId={focusedElementId}
        isRestoringFocus={false}
      >
        {songsWithAlbum.map((song) => {
          const queue = queueByAlbumId.get(song.album.id) ?? [song];
          const isCurrent = currentSong?.id === song.id;

          return (
            <NavigationButton
              key={song.id}
              customKey={`related-song-${song.id}`}
              className="shrink-0 justify-start rounded-xl! py-8! px-12!"
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
