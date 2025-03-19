import useMusicStore from '@/context/music.context'
import React from 'react'
import LazyImage from '../ui/LazyImage'

function CoverImage({ isMobile }: { isMobile: boolean }) {
  const { currentSong } = useMusicStore()
  return (
    <LazyImage
      src={currentSong?.album.coverSrc}
      alt={currentSong?.song.name}
      width={isMobile ? 100 : 200}
      height={isMobile ? 100 : 200}
      className="rounded-lg"
    />
  )
}

export default CoverImage
