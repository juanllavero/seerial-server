import { Button } from '@/components/ui/button'
import useMusicStore from '@/context/music.context'
import React from 'react'

function MusicControlsMobile() {
  const { setMusicPlayerContracted, musicPlayerContracted } = useMusicStore()
  return (
    <div>
      <Button onClick={() => setMusicPlayerContracted(!musicPlayerContracted)}>
        Show/Hide
      </Button>
    </div>
  )
}

export default MusicControlsMobile
