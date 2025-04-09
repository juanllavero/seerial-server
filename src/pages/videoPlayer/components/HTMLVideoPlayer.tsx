import { useServerStore } from '@/context/server.context'
import React, { useEffect } from 'react'

interface HTMLVideoPlayerProps {
  url: string
  start?: number
  audioTrack?: number
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function HTMLVideoPlayer({
  url,
  start,
  audioTrack,
  videoRef,
}: HTMLVideoPlayerProps) {
  const { serverIP } = useServerStore()

  // const urlsTest = [
  //   'F:\\UHD\\El Caballero Oscuro\\El Caballero Oscuro (2008)\\El Caballero Oscuro (2008).mkv',
  //   'F:\\The Criterion Collection\\Akira Kurosawa Collection\\Los Siete Samuráis (1954)\\Los Siete Samuráis (1954).mkv',
  //   'F:\\UHD\\Dune\\Dune (2021)\\Dune (2021).mkv',
  //   'F:\\The Criterion Collection\\Mulholland Drive (2001)\\Mulholland Drive (2001).mkv',
  //   'F:\\Anime\\FullMetal Alchemist Brotherhood\\S1\\Fullmetal Alchemist Brotherhood - S01E01 - Fullmetal Alchemist.mkv',
  //   'http://seerial.sirjohn.es/video-file?path=F:\\Anime\\FullMetal Alchemist Brotherhood\\S1\\Fullmetal Alchemist Brotherhood - S01E01 - Fullmetal Alchemist.mkv',
  // ]

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
    <div data-vjs-player>
      <video
        ref={videoRef}
        src={`http://${serverIP}/stream-video?path=${url}${start ? `&start=${start}` : ''}${audioTrack ? `&audio=${audioTrack}` : ''}`}
        crossOrigin="anonymous"
        playsInline
        autoPlay
      />
    </div>
  )
}

export default HTMLVideoPlayer
