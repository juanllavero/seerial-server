import { useMusicStore } from '@seerial/stores';
import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import NavigationButton from '@/components/navigation/NavigationButton';
import Image from '@/components/ui/Image';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

function MiniMusicPlayerButton() {
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

  if (!isShown || !currentSong || isExpanded) {
    return null;
  }

  return (
    <NavigationButton
      customKey={NavigationFocusKeys.topBar.musicPlayer}
      onClick={() => setIsExpanded(true)}
      className="mr-2"
      title={currentSong.title}
      variant="ghost"
      icon={
        <Image
          url={album?.coverSrc ?? ''}
          className="rounded-md overflow-hidden"
          width="4.2dvh"
          height="4.2dvh"
        />
      }
      hideText
    />
  );
}

export default memo(MiniMusicPlayerButton);
