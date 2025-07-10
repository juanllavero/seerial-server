import React, { useEffect } from 'react'

interface HTMLVideoPlayerProps {
  url: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function HTMLVideoPlayer({ url, videoRef }: HTMLVideoPlayerProps) {
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
        src={url}
        crossOrigin="anonymous"
        playsInline
        autoPlay
      />
    </div>
  )
}

export default HTMLVideoPlayer
