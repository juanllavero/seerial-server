import { memo } from 'react'
import useMusicStore from '@/context/music.context'
import MusicControlsExpanded from './controls/MusicControlsExpanded'

function DesktopMusicPlayer() {
  const { album, currentSong } = useMusicStore()

  if (!album || !currentSong) return null

  return (
    <div
      className={`fixed bottom-0 z-200 flex h-fit w-screen flex-row bg-transparent transition-all duration-500 ease-in-out`}
    >
      <MusicControlsExpanded title={currentSong.title} subtitle={album.title} />
    </div>
  )
}

export default memo(DesktopMusicPlayer)
