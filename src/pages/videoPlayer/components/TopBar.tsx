import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Video } from '@/data/interfaces/Media'
import { ChevronLeft, Minimize2, Maximize2 } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

interface VideoInfo {
  title: string
  subtitle: string
  preferAudioLan: string
  preferSubtitleLan: string
  subsMode: string
}

interface TopBarProps {
  video: Video
  videoRef: React.RefObject<HTMLVideoElement | null>
  videoInfo: VideoInfo | undefined
  isPlaying: boolean
  isFullscreen: boolean
  handleFullscreen: () => void
  showControls: boolean
  serverUrl: string
  currentTime: number
  setVideoLoaded: (value: boolean) => void
  setIsPlaying: (value: boolean) => void
}

function TopBar({
  video,
  videoRef,
  videoInfo,
  isPlaying,
  isFullscreen,
  handleFullscreen,
  showControls,
  serverUrl,
  currentTime,
  setVideoLoaded,
  setIsPlaying,
}: TopBarProps) {
  const navigate = useNavigate()

  const handleGoBack = async () => {
    if (!video) return

    setVideoLoaded(false)
    setIsPlaying(false)

    await fetch(`${serverUrl}/updateWatchState`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: video.id,
        timeWatched: currentTime,
        watched: currentTime > video.runtime * 60 * 0.9,
      }),
    })

    navigate(-1)
  }

  return (
    <FlexBox
      justify="space-between"
      align="center"
      width={'100%'}
      gap={0.5}
      padding="1rem 1rem 2.5rem 1rem"
      className={`top-shadow fixed top-0 z-10 gap-4 ${isPlaying && !showControls ? '' : 'active'}`}
    >
      <FlexBox gap={1} align="center" justify="center">
        <Button
          variant={'ghost'}
          onClick={(e) => {
            e.stopPropagation()
            handleGoBack()
          }}
        >
          <ChevronLeft />
        </Button>
        <span className="text-xl font-semibold">
          {videoInfo?.title} {videoInfo?.subtitle}
        </span>
      </FlexBox>
      <Button
        variant={'ghost'}
        onClick={(e) => {
          e.stopPropagation()
          handleFullscreen()
        }}
      >
        {isFullscreen ? <Minimize2 /> : <Maximize2 />}
      </Button>
    </FlexBox>
  )
}

export default TopBar
