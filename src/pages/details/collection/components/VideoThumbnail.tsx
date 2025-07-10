import { Skeleton } from '@/components/ui/skeleton'
import { useState, useRef } from 'react'

function VideoPlayer({
  videoUrl,
  snapshotAtTime = 10,
}: {
  videoUrl: string
  snapshotAtTime?: number
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)

  const generateThumbnail = () => {
    if (thumbnail) return

    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    try {
      const thumbnailUrl = canvas.toDataURL('image/jpeg')
      setThumbnail(thumbnailUrl)
    } catch (e) {
      console.error(e)
      setError(
        'No se pudo generar el thumbnail. Revisa la consola para ver errores de CORS.',
      )
    }
  }

  const handleVideoLoad = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = snapshotAtTime
    }
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    const video = videoRef.current
    if (video) {
      if (!hasPlayedOnce) {
        video.currentTime = 0
        setHasPlayedOnce(true)
      }
      video
        .play()
        .catch((err) => console.error('Error al intentar reproducir:', err))
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    const video = videoRef.current
    if (video) {
      video.pause()
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '16 / 9',
        cursor: 'pointer',
        backgroundColor: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedData={handleVideoLoad}
        onSeeked={generateThumbnail}
        className="rounded-xl"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out',
        }}
        crossOrigin="anonymous"
        muted
        loop
        playsInline // Important for iOS playback
      />

      {/* Thumbnail Image */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="rounded-xl"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: isHovering ? 0 : 1,
            transition: 'opacity 0.4s ease-in-out',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Skeleton and Error message */}
      {!thumbnail && !error && (
        <Skeleton className="h-full w-full rounded-xl" />
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}

export default VideoPlayer
