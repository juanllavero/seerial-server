import type { Album, Song } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import NavigationButton from '@/components/navigation/NavigationButton';
import Tertiary from '@/components/text/Tertiary';
import FlexBox from '@/components/ui/FlexBox';

interface SongsListProps {
  album: Album;
  songs: Song[];
}

function getSafeDiscNumber(song: Song): number {
  return song.discNumber > 0 ? song.discNumber : 1;
}

function getSafeTrackNumber(song: Song): number {
  return song.trackNumber > 0 ? song.trackNumber : Number.MAX_SAFE_INTEGER;
}

function SongsList({ album, songs }: SongsListProps) {
  const { t } = useTranslation();
  const setPlaybackContext = useMusicStore((state) => state.setPlaybackContext);

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
    <FlexBox direction="column" gap={1} width="100%" className="pb-8">
      {showTracksHeader ? (
        <>
          <Tertiary>{t('tracks')}</Tertiary>
          <FlexBox direction="column" gap={0.6} width="100%">
            {sortedSongs.map((song) => {
              const trackNumber = song.trackNumber > 0 ? `${song.trackNumber}. ` : '';

              return (
                <NavigationButton
                  key={song.id ?? `${song.title}-${song.fileSrc}`}
                  text={`${trackNumber}${song.title}`}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setPlaybackContext(song, album, queue)}
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
                <Tertiary>
                  {t('disc')} {discNumber}
                </Tertiary>
                {songsByDisc.map((song) => {
                  const trackNumber = song.trackNumber > 0 ? `${song.trackNumber}. ` : '';

                  return (
                    <NavigationButton
                      key={song.id ?? `${song.title}-${song.fileSrc}`}
                      text={`${trackNumber}${song.title}`}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setPlaybackContext(song, album, queue)}
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
