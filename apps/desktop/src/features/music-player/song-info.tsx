import { useMusicStore } from '@seerial/stores';
import { memo, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import FlexBox from '@/shared/components/ui/flex-box';
import AnimatedSoundBars from './animated-sound-bars';

function getArtistsText(artists?: string[]): string {
  if (!artists || artists.length === 0) {
    return '';
  }

  return artists.join(' • ');
}

const SongInfo = () => {
  const { currentSong, isPlaying, album } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      album: state.album,
    }),
    shallow,
  );

  const artistsText = useMemo(() => {
    return getArtistsText(currentSong?.artists);
  }, [currentSong?.artists]);

  if (!currentSong) {
    return null;
  }

  return (
    <FlexBox direction="column" align="center" className="max-w-[30dvw]">
      <div className="relative inline-flex items-center justify-center">
        <AnimatedSoundBars isPlaying={isPlaying} />

        <h2
          className="text-[2.6vh] font-semibold line-clamp-1"
          style={{ textShadow: '0 1px 2px black' }}
        >
          {currentSong.title}
        </h2>
      </div>
      <span
        className="text-[1.8dvh] line-clamp-1 font-semibold text-center"
        style={{
          color: 'var(--color-muted-foreground)',
          textShadow: '0 1px 2px black',
        }}
      >
        {artistsText} - {album?.title}
      </span>
    </FlexBox>
  );
};

export default memo(SongInfo);
