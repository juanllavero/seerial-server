import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AudioTrack, SubtitleTrack } from '@/data/interfaces/MediaInfo'
import React from 'react'
import useDataStore from '@/context/data.context'
import HTMLVideoPlayer from './components/HTMLVideoPlayer'
import {
  Captions,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import FlexBox from '@/components/ui/FlexBox'
import { formatTime, getOnlyYear } from '@/utils/ReactUtils'
import { TrackNextIcon, TrackPreviousIcon } from '@radix-ui/react-icons'
import Loading from '@/components/Loading'
import DropdownWrapper from '@/components/DropdownWrapper'
import './VideoPlayerPage.css'
import { useNavigate } from '@tanstack/react-router'

function VideoPlayerPage() {
  const {
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectedEpisode: episode,
  } = useDataStore()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLoadingCircle, setShowLoadingCircle] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [previewTime, setPreviewTime] = useState(0)

  // Controls
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [inControls, setInControls] = useState(false)

  // Timeline
  const timelineRef = useRef<HTMLDivElement>(null)
  const [wasPaused, setWasPaused] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)

  if (!episode) {
    return null
  }

  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(
    episode.audioTracks?.find((track) => track.selected) || null,
  )
  const [selectedSubtitle, setSelectedSubtitle] =
    useState<SubtitleTrack | null>(
      episode.subtitleTracks?.find((track) => track.selected) || null,
    )

  //#region Player Controls
  const getVolumeIcon = () => {
    const volume = videoRef.current?.volume

    if (!volume || volume === 0 || videoRef.current?.muted) {
      return <VolumeOff />
    } else if (volume < 0.5) {
      return <Volume1 />
    } else {
      return <Volume2 />
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted

    if (video.muted) {
      setVolume(0)
    } else {
      setVolume(video.volume)
    }
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Number(event.target.value)

    setVolume(newVolume)
    video.volume = newVolume

    const percent = newVolume * 100
    event.target.style.background = `linear-gradient(to right, var(--app-color) ${percent}%, white ${percent}%)`
  }

  const handleFullscreen = () => {
    const video = videoRef.current

    if (!video) return

    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skip = (duration: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime += duration
  }
  //#endregion

  // Gets the end time of the video
  const getEndTime = (currentSecond: number) => {
    const duration = videoRef.current?.duration || 0

    const remainingTime = duration - currentSecond
    const now = new Date()
    const endTime = new Date(now.getTime() + remainingTime * 1000)

    const hours = endTime.getHours().toString().padStart(2, '0')
    const minutes = endTime.getMinutes().toString().padStart(2, '0')

    return `${hours}:${minutes}`
  }

  //#region Timeline
  const handleTimelineUpdate = (e: any) => {
    const video = videoRef.current
    if (!video || !e.target || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width

    setPreviewTime(video.duration * percent)
    timelineRef.current.style.setProperty(
      '--preview-position',
      percent.toString(),
    )

    if (isScrubbing) {
      e.preventDefault()
      timelineRef.current.style.setProperty(
        '--progress-position',
        percent.toString(),
      )
    }
  }

  const toggleScrubbing = (e: any) => {
    const video = videoRef.current
    if (!video || !e.target || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width

    const scrubbing = (e.buttons & 1) === 1
    setIsScrubbing(scrubbing)

    if (scrubbing) {
      setWasPaused(video.paused)
      videoRef.current?.pause()
    } else {
      video.currentTime = percent * video.duration
      if (!wasPaused) video.play()
    }

    handleTimelineUpdate(e)
  }
  //#endregion

  //#region Show/Hide Controls
  const handleMouseMove = () => {
    setShowControls(true)

    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Create new timeout to hide controls after 2 seconds
    timeoutRef.current = setTimeout(() => {
      if (!inControls) setShowControls(false)
    }, 2000)
  }

  const handleMouseLeave = () => {
    setShowControls(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }
  //#endregion

  // On video loaded
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Listen to time update
    video.addEventListener('timeupdate', () => {
      setCurrentTime(video.currentTime)
      const percent = video.currentTime / video.duration
      timelineRef.current?.style.setProperty(
        '--progress-position',
        percent.toString(),
      )
    })

    // Set Play/Pause state
    setIsPlaying(!video.paused)

    // Show video player
    const handlePlay = () => {
      setVideoLoaded(true)
      setIsPlaying(true)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          event.preventDefault()
          skip(-5)
          break
        case 'ArrowRight':
          event.preventDefault()
          skip(10)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    video.addEventListener('play', handlePlay)
    video.addEventListener('seeking', () => setShowLoadingCircle(true))
    video.addEventListener('seeked', () => setShowLoadingCircle(false))
    video.addEventListener('waiting', () => setShowLoadingCircle(true))
    video.addEventListener('playing', () => setShowLoadingCircle(false))

    // Clean listeners on unmount
    return () => {
      video.removeEventListener('play', handlePlay)
      video.addEventListener('seeking', () => setShowLoadingCircle(true))
      video.addEventListener('seeked', () => setShowLoadingCircle(false))
      video.addEventListener('waiting', () => setShowLoadingCircle(true))
      video.addEventListener('playing', () => setShowLoadingCircle(false))
      window.removeEventListener('keydown', handleKeyDown)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Loading Circle */}
      {(!videoLoaded || showLoadingCircle) && (
        <div className="absolute top-50/100 left-50/100 z-999 flex justify-center">
          <Loading />
        </div>
      )}

      {/* Video Player */}
      <div
        className={`player-container absolute top-0 left-0 z-0 m-0 flex h-full w-full justify-center bg-black p-0 ${!showControls ? 'hide-cursor' : ''}`}
        style={{
          backgroundColor: videoLoaded ? 'black' : 'transparent',
          transition: 'background-color .1s ease-in-out',
        }}
        onMouseUp={(e) => {
          if (isScrubbing) toggleScrubbing(e)
        }}
        onMouseMove={(e) => {
          handleMouseMove()

          if (isScrubbing) handleTimelineUpdate(e)
        }}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          handleFullscreen()
        }}
      >
        {/* Top Bar */}
        <FlexBox
          justify="space-between"
          align="center"
          width={'100%'}
          gap={0.5}
          padding="1rem 1rem 2.5rem 1rem"
          className={`top-shadow fixed top-0 z-1 gap-4 ${isPlaying && !showControls ? '' : 'active'}`}
        >
          <FlexBox gap={1} align="center" justify="center">
            <Button
              variant={'ghost'}
              onClick={() => navigate({ to: '/details' })}
            >
              <ChevronLeft />
            </Button>
            <span className="text-xl font-semibold">
              {selectedLibrary?.type === 'Movies'
                ? `${selectedSeason?.name} (${getOnlyYear(selectedSeason?.year ?? '')})`
                : `${selectedSeries?.name} S${episode.seasonNumber}E${episode.episodeNumber} - ${episode.name}`}
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

        <HTMLVideoPlayer
          url={episode.videoSrc}
          videoRef={videoRef}
          togglePlay={togglePlay}
        />

        {/* Controls */}
        <FlexBox
          direction="column"
          justify="center"
          align="center"
          width={'100%'}
          gap={0.8}
          onClick={(e) => e?.stopPropagation()}
          onMouseEnter={() => setInControls(true)}
          onMouseLeave={() => setInControls(false)}
          padding="5rem 1rem 1rem 1rem"
          className={`bottom-shadow fixed bottom-0 z-1 gap-4 ${isPlaying && !showControls ? '' : 'active'}`}
        >
          <FlexBox gap={1} width={'100%'} justify="start" align="center">
            <span>{formatTime(currentTime)}</span>

            {/* Timeline */}
            <div
              className="timeline-container w-full"
              ref={timelineRef}
              onMouseMove={handleTimelineUpdate}
              onMouseDown={toggleScrubbing}
            >
              <div className="timeline">
                <div className="preview-time">
                  <span>{formatTime(previewTime)}</span>
                </div>
                <div className="thumb-indicator"></div>
              </div>
            </div>

            <span>
              {formatTime(
                videoRef.current ? videoRef.current.duration - currentTime : 0,
              )}
            </span>
          </FlexBox>
          <FlexBox width={'100%'} justify="space-between" gap={1}>
            <FlexBox gap={0.5} align="center">
              <Button
                variant={'ghost'}
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
                size={'icon'}
              >
                {isPlaying ? <Pause /> : <Play />}
              </Button>
              <FlexBox gap={0.1}>
                <Button
                  variant={'ghost'}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  size={'icon'}
                >
                  <TrackPreviousIcon />
                </Button>
                <Button
                  variant={'ghost'}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  size={'icon'}
                >
                  <TrackNextIcon />
                </Button>
              </FlexBox>

              <span className="ml-2 text-sm">
                Ends at {getEndTime(currentTime)}
              </span>
            </FlexBox>
            <FlexBox gap={0.5}>
              <DropdownWrapper
                content={{
                  items: [
                    {
                      items: episode.audioTracks.map((track) => ({
                        title: `${track.displayTitle} (${track.language})`,
                        action: () => {
                          setSelectedAudio(track)
                        },
                      })),
                    },
                  ],
                }}
                button={
                  <Button
                    variant={'ghost'}
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Music2 />
                  </Button>
                }
              />
              <DropdownWrapper
                content={{
                  items: [
                    {
                      items: episode.subtitleTracks.map((track) => ({
                        title: `${track.displayTitle} (${track.language})`,
                        action: () => {
                          setSelectedSubtitle(track)
                        },
                      })),
                    },
                  ],
                }}
                button={
                  <Button
                    className="show-controls"
                    variant={'ghost'}
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Captions />
                  </Button>
                }
              />
              <FlexBox align="center" justify="center">
                <Button
                  className="show-controls"
                  variant={'ghost'}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute()
                  }}
                >
                  {getVolumeIcon()}
                </Button>
                <input
                  type="range"
                  className="vertical-slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleVolumeChange(e)
                  }}
                  style={{
                    background: `linear-gradient(to right, var(--app-color) ${volume * 100}%, white ${volume * 100}%)`,
                  }}
                />
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </FlexBox>
      </div>
    </>
  )
}

export default VideoPlayerPage
