import React, { useEffect } from 'react'
import './HTMLVideoPlayer.css'

interface HTMLVideoPlayerProps {
  url: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function HTMLVideoPlayer({ url, videoRef }: HTMLVideoPlayerProps) {
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.src = url
      video.load()
      video.play().catch((e) => {
        console.log(e)
      })
    }
  }, [url, videoRef])

  return (
    <div data-vjs-player className="hide-video">
      <video ref={videoRef} crossOrigin="anonymous" playsInline />
    </div>
  )
}

export default HTMLVideoPlayer
