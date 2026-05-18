import { useMusicStore } from '@seerial/stores';
import { memo } from 'react';
import { useMatch } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { NavigationButton, NavigationContainer } from '@/shared/components/navigation';
import Image from '@/shared/components/ui/image';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import AnimatedSoundBars from './animated-sound-bars';

const DETAIL_ROUTES = [
  'details/movie/:movieId',
  'details/series/:seriesId',
  'details/album/:albumId',
  'details/collection/:collectionId/:type',
] as const;

function useIsDetailPage() {
  const movieMatch = useMatch(DETAIL_ROUTES[0]);
  const seriesMatch = useMatch(DETAIL_ROUTES[1]);
  const albumMatch = useMatch(DETAIL_ROUTES[2]);
  const collectionMatch = useMatch(DETAIL_ROUTES[3]);
  return Boolean(movieMatch ?? seriesMatch ?? albumMatch ?? collectionMatch);
}

function MiniMusicPlayerButton({ overlay = false }: { overlay?: boolean }) {
  const { album, currentSong, isShown, isExpanded, setIsExpanded } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isShown: state.isShown,
      isExpanded: state.isExpanded,
      setIsExpanded: state.setIsExpanded,
    }),
    shallow,
  );
  const isDetailPage = useIsDetailPage();

  // Overlay mode only renders on detail pages (top-bar is hidden there).
  // Default mode renders inside the top-bar container (non-detail pages).
  if (overlay && !isDetailPage) return null;
  if (!isShown || !currentSong || isExpanded) return null;

  const button = (
    <NavigationButton
      customKey={NavigationFocusKeys.topBar.musicPlayer}
      onClick={() => setIsExpanded(true)}
      className="rounded-md! p-1!"
      title={currentSong.title}
      variant="ghost"
      hideText
    >
      <div className="relative flex items-center justify-center">
        <AnimatedSoundBars isPlaying={true} />
        <Image
          url={album?.coverSrc ?? ''}
          className="rounded-md overflow-hidden"
          width="4.2dvh"
          height="4.2dvh"
        />
      </div>
    </NavigationButton>
  );

  if (overlay) {
    return (
      <NavigationContainer
        customFocusKey="mini-music-player-overlay"
        className="fixed z-50 top-[2.5vh] right-[10vh]"
      >
        {button}
      </NavigationContainer>
    );
  }

  return <div className="absolute z-50 top-[2.5vh] right-[10vh]">{button}</div>;
}

export default memo(MiniMusicPlayerButton);
