import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { Album, Song } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import ListTitle from '@/shared/components/text/list-title';
import FlexBox from '@/shared/components/ui/flex-box';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import SongCard from './song-card';

interface SongsListProps {
  album: Album;
  songs: Song[];
  focusedSongId?: string;
  onSongFocus?: (songId: string) => void;
  onNavigateToRelated?: () => void;
}

function getSafeDiscNumber(song: Song): number {
  return song.discNumber > 0 ? song.discNumber : 1;
}

function getSafeTrackNumber(song: Song): number {
  return song.trackNumber > 0 ? song.trackNumber : Number.MAX_SAFE_INTEGER;
}

function SongsList({
  album,
  songs,
  focusedSongId,
  onSongFocus,
  onNavigateToRelated,
}: SongsListProps) {
  const { t } = useTranslation();
  const { currentSong, isPlaying, setPlaybackContext } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      setPlaybackContext: state.setPlaybackContext,
    }),
    shallow,
  );

  // Set focus on load
  useEffect(() => {
    if (focusedSongId) {
      setFocus(focusedSongId);
      return;
    }

    if (currentSong?.albumId === album.id) {
      setFocus(currentSong?.id ?? NavigationFocusKeys.details.playButton);
      return;
    }

    setFocus(NavigationFocusKeys.details.playButton);
  }, [focusedSongId, currentSong?.id, currentSong?.albumId, album.id]);

  const sortedSongs = useMemo(
    () =>
      [...songs].sort(
        (a, b) =>
          getSafeTrackNumber(a) - getSafeTrackNumber(b) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      ),
    [songs],
  );

  const discNumbers = useMemo(
    () => [...new Set(sortedSongs.map((song) => getSafeDiscNumber(song)))].sort((a, b) => a - b),
    [sortedSongs],
  );

  const queue = useMemo(
    () =>
      [...songs].sort(
        (a, b) =>
          getSafeDiscNumber(a) - getSafeDiscNumber(b) ||
          getSafeTrackNumber(a) - getSafeTrackNumber(b) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      ),
    [songs],
  );

  const showTracksHeader =
    discNumbers.length === 0 || (discNumbers.length === 1 && discNumbers[0] === 1);

  if (songs.length === 0) {
    return null;
  }

  return (
    <FlexBox direction="column" gap={1} width="100%" padding="0 4rem">
      {showTracksHeader ? (
        <>
          <ListTitle className="pl-0! py-[3dvh]">{t('tracks')}</ListTitle>
          <FlexBox direction="column" gap={0.6} width="100%">
            {sortedSongs.map((song) => {
              return (
                <SongCard
                  key={song.id ?? `${song.title}-${song.fileSrc}`}
                  song={song}
                  currentSongId={currentSong?.id}
                  focusedSongId={focusedSongId}
                  isPlaying={isPlaying}
                  onClick={() => setPlaybackContext(song, album, queue)}
                  onFocus={() => song.id && onSongFocus?.(song.id)}
                  onNavigateToRelated={onNavigateToRelated}
                />
              );
            })}
          </FlexBox>
        </>
      ) : (
        <FlexBox direction="column" gap={1.25} width="100%">
          {discNumbers.map((discNumber) => {
            const songsByDisc = sortedSongs.filter(
              (song) => getSafeDiscNumber(song) === discNumber,
            );

            return (
              <FlexBox direction="column" gap={0.6} width="100%" key={`disc-${discNumber}`}>
                <ListTitle className="pl-0! py-[3dvh]">
                  {t('disc')} {discNumber}
                </ListTitle>
                {songsByDisc.map((song) => {
                  return (
                    <SongCard
                      key={song.id ?? `${song.title}-${song.fileSrc}`}
                      song={song}
                      currentSongId={currentSong?.id}
                      focusedSongId={focusedSongId}
                      isPlaying={isPlaying}
                      onClick={() => setPlaybackContext(song, album, queue)}
                      onFocus={() => song.id && onSongFocus?.(song.id)}
                      onNavigateToRelated={onNavigateToRelated}
                    />
                  );
                })}
              </FlexBox>
            );
          })}
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default memo(SongsList);
