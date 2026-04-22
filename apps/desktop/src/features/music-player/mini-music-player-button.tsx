import { useMusicStore } from '@seerial/stores';
import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import { NavigationButton } from '@/shared/components/navigation';
import Image from '@/shared/components/ui/image';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import AnimatedSoundBars from './animated-sound-bars';

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
    <div className="absolute z-50 top-[2.5vh] right-[10vh]">
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
    </div>
  );
}

export default memo(MiniMusicPlayerButton);
