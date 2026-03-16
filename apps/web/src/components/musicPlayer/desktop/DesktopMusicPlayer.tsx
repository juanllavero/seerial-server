import { memo } from 'react'
import { shallow } from 'zustand/shallow'
import { useMusicStore } from '@seerial/stores'
import MusicControlsExpanded from './controls/MusicControlsExpanded'

function DesktopMusicPlayer() {
  const { album, currentSong, isShown } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isShown: state.isShown,
    }),
    shallow,
  )

  return (
    <div
      className={`fixed bottom-0 z-200 flex h-fit w-screen flex-row bg-transparent transition-all duration-400 ease-in-out ${isShown ? 'translate-y-0' : 'translate-y-50'}`}
    >
      <MusicControlsExpanded title={currentSong?.title ?? ''} subtitle={album?.title ?? ''} />
    </div>
  )
}

export default memo(DesktopMusicPlayer)
