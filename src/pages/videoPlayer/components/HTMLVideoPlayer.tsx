import React from 'react'
import { useEffect } from 'react'
import { useServerStore } from '@/context/server.context'

interface HTMLVideoPlayerProps {
  url: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function HTMLVideoPlayer({ url, videoRef }: HTMLVideoPlayerProps) {
  const { serverIP } = useServerStore()

  if (!url) {
    return null
  }

  useEffect(() => {
    if (!videoRef) return

    const video = videoRef.current
    if (video) {
      video.load()
    }
  }, [url])

  return (
    <video
      ref={videoRef}
      src={`https://${serverIP}/video-file?path=F:\\Anime\\FullMetal Alchemist Brotherhood\\S1\\Fullmetal Alchemist Brotherhood - S01E01 - Fullmetal Alchemist.mkv`}
      //src="../../test.mkv"
      crossOrigin="anonymous"
      playsInline
      autoPlay
    />
  )
}

export default HTMLVideoPlayer
