import useMusicStore from '@/context/music.context'
import React from 'react'

function MusicControls() {
  const { currentSong } = useMusicStore()

  return <div>{currentSong?.song.name}</div>
}

export default MusicControls
