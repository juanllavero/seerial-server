import DropdownWrapper from '@/components/DropdownWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import { useServerStore } from '@/context/server.context'
import { Video } from '@/data/interfaces/Media'
import { AudioTrack, SubtitleTrack } from '@/data/interfaces/MediaInfo'
import { formatTime, getAudioTrack, getSubtitleTrack } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { TrackNextIcon, TrackPreviousIcon } from '@radix-ui/react-icons'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Captions,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Volume1,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import HTMLVideoPlayer from './components/HTMLVideoPlayer'
import './VideoPlayerPage.css'

interface VideoInfo {
  title: string
  subtitle: string
  preferAudioLan: string
  preferSubtitleLan: string
  subsMode: string
}

function VideoPlayerPage() {
  const serverIP = useServerStore((state) => state.serverIP)
  const navigate = useNavigate()
  const { videoId } = useParams()

  // Get video data
  const {
    data: video,
    isLoading: loadingVideo,
    mutate,
  } = useSWR<Video>(
    videoId && serverIP !== ''
      ? `http://${serverIP}/details/video?id=${videoId}`
      : null,
    fetcher,
  )

  // Get video info
  const { data: videoInfo, isLoading: loadingVideoInfo } = useSWR<VideoInfo>(
    videoId && serverIP !== ''
      ? `http://${serverIP}/videoInfo?id=${videoId}`
      : null,
    fetcher,
  )

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLoadingCircle, setShowLoadingCircle] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [duration, setDuration] = useState(video ? video.runtime / 60 : 0)
  const [videoStart, setVideoStart] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [previewTime, setPreviewTime] = useState(0)
  const [buffered, setBuffered] = useState(0)

  // State for triggering stream reload
  const [streamStartTime, setStreamStartTime] = useState(0)

  // Controls
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [inControls, setInControls] = useState(false)

  // Timeline
  const timelineRef = useRef<HTMLDivElement>(null)
  const [wasPaused, setWasPaused] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<AudioTrack | null>(
      video?.audioTracks?.find((track) => track.selected) || null,
    )
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] =
    useState<SubtitleTrack | null>(
      video?.subtitleTracks?.find((track) => track.selected) || null,
    )

  // This hook reconstructs the video source URL whenever a dependency changes.
  const videoSrc = useMemo(() => {
    if (!video?.fileSrc || !serverIP) return ''

    const params = new URLSearchParams({
      path: video.fileSrc,
    })
    if (streamStartTime > 0) {
      params.append('start', Math.floor(streamStartTime).toString())
    }

    if (selectedAudioTrack) {
      params.append(
        'audio',
        selectedAudioTrack.id && selectedAudioTrack.id > 0
          ? String(selectedAudioTrack.id - 1)
          : '0',
      )
    }
    if (selectedSubtitleTrack) {
      params.append(
        'subs',
        selectedSubtitleTrack.id && selectedSubtitleTrack.id > 0
          ? String(selectedSubtitleTrack.id - 1)
          : '0',
      )
    }

    return `http://${serverIP}/stream-video?${params.toString()}`
  }, [
    serverIP,
    video,
    streamStartTime,
    selectedAudioTrack,
    selectedSubtitleTrack,
  ])

  // These functions now correctly update the state to trigger the 'videoSrc' recalculation.
  const handleAudioTrackChange = (track: AudioTrack) => {
    if (!videoRef.current) return
    setStreamStartTime(videoRef.current.currentTime)
    setSelectedAudioTrack(track)
  }

  const handleSubtitleTrackChange = (track: SubtitleTrack | null) => {
    if (!videoRef.current) return
    setStreamStartTime(videoRef.current.currentTime)
    setSelectedSubtitleTrack(track)
  }

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
    const videoPlayer = videoRef.current
    if (!videoPlayer) return
    if (videoPlayer.paused) {
      videoPlayer.play()
      setIsPlaying(true)
    } else {
      videoPlayer.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    videoPlayer.muted = !videoPlayer.muted

    if (videoPlayer.muted) {
      setVolume(0)
    } else {
      setVolume(videoPlayer.volume)
    }
  }

  const handleGoBack = async () => {
    if (!video) return

    setVideoLoaded(false)
    setIsPlaying(false)

    await fetch(`http://${serverIP}/updateWatchState`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: video.id,
        timeWatched: currentTime,
        watched: currentTime > (video.runtime / 60) * 0.9,
      }),
    })

    navigate(-1)
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    const newVolume = Number(event.target.value)

    setVolume(newVolume)
    videoPlayer.volume = newVolume

    const percent = newVolume * 100
    event.target.style.background = `linear-gradient(to right, var(--app-color) ${percent}%, white ${percent}%)`
  }

  const handleFullscreen = () => {
    const videoPlayer = videoRef.current

    if (!videoPlayer) return

    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skip = (duration: number) => {
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    videoPlayer.currentTime += duration
  }
  //#endregion

  // Gets the end time of the video
  const getEndTime = (currentSecond: number) => {
    const remainingTime = duration - currentSecond
    const now = new Date()
    const endTime = new Date(now.getTime() + remainingTime * 1000)

    const hours = endTime.getHours().toString().padStart(2, '0')
    const minutes = endTime.getMinutes().toString().padStart(2, '0')

    return `${hours}:${minutes}`
  }

  //#region Timeline
  const handleTimelineUpdate = (e: any) => {
    const videoPlayer = videoRef.current
    if (!videoPlayer || !e.target || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width

    setPreviewTime(duration * percent)
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
    const videoPlayer = videoRef.current
    if (!videoPlayer || !e.target || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width

    const scrubbing = (e.buttons & 1) === 1
    setIsScrubbing(scrubbing)

    if (scrubbing) {
      setWasPaused(videoPlayer.paused)
      videoRef.current?.pause()
    } else {
      videoPlayer.currentTime = percent * duration
      if (!wasPaused) videoPlayer.play()
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
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(videoPlayer.currentTime)
        timelineRef.current?.style.setProperty(
          '--progress-position',
          (videoPlayer.currentTime / duration).toString(),
        )
      }
      // Update buffer bar
      if (videoPlayer.buffered.length > 0 && duration > 0) {
        const bufferedEnd = videoPlayer.buffered.end(
          videoPlayer.buffered.length - 1,
        )
        timelineRef.current?.style.setProperty(
          '--buffer-position',
          (bufferedEnd / duration).toString(),
        )
      }
    }
    const onLoadedData = () => {
      setShowLoadingCircle(false)
      setDuration(video ? video.runtime / 60 : 0)
    }
    const onWaiting = () => setShowLoadingCircle(true)
    const onPlaying = () => setShowLoadingCircle(false)

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, textarea')) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'f':
          e.preventDefault()
          handleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    videoPlayer.addEventListener('play', onPlay)
    videoPlayer.addEventListener('pause', onPause)
    videoPlayer.addEventListener('timeupdate', onTimeUpdate)
    videoPlayer.addEventListener('loadeddata', onLoadedData)
    videoPlayer.addEventListener('waiting', onWaiting)
    videoPlayer.addEventListener('playing', onPlaying)
    window.addEventListener('keydown', onKeyDown)

    // Cleanup function
    return () => {
      videoPlayer.removeEventListener('play', onPlay)
      videoPlayer.removeEventListener('pause', onPause)
      videoPlayer.removeEventListener('timeupdate', onTimeUpdate)
      videoPlayer.removeEventListener('loadeddata', onLoadedData)
      videoPlayer.removeEventListener('waiting', onWaiting)
      videoPlayer.removeEventListener('playing', onPlaying)
      window.removeEventListener('keydown', onKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [duration, isScrubbing, skip, togglePlay])

  useEffect(() => {
    if (!video || !videoInfo) return

    const fetchData = async () => {
      const result = await fetch(`http://${serverIP}/updateMediaInfo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
        }),
      })

      if (!result.ok) {
        return
      }

      const data = await result.json()

      const audioTrack = getAudioTrack(videoInfo.preferAudioLan, video)
      const subtitleTrack = getSubtitleTrack(
        videoInfo.preferSubtitleLan,
        videoInfo.subsMode,
        video,
      )
      const videoTrack = data.videoTracks[0] ?? null

      setSelectedAudioTrack(audioTrack)
      setSelectedSubtitleTrack(subtitleTrack)

      if (videoTrack && video.videoTracks) {
        for (const videoTrack of video.videoTracks) {
          videoTrack.selected = false
        }
        videoTrack.selected = true
      }

      if (audioTrack && video.audioTracks) {
        for (const audioTrack of video.audioTracks) {
          audioTrack.selected = false
        }
        audioTrack.selected = true
      }

      if (subtitleTrack && video.subtitleTracks) {
        for (const subTrack of video.subtitleTracks) {
          subTrack.selected = false
        }
        subtitleTrack.selected = true
      }

      mutate()
    }

    fetchData()
  }, [videoId])

  if (!video || loadingVideo || loadingVideoInfo) {
    return <Loading />
  }

  return (
    <>
      {/* Loading Circle */}
      {/* {(!videoLoaded || showLoadingCircle) && (
        <div className="relative flex h-screen w-screen justify-center">
          <Loading />
        </div>
      )} */}

      {/* Video Player */}
      <div
        className={`player-container relative m-0 flex h-screen w-screen justify-center bg-black p-0 ${!showControls ? 'hide-cursor' : ''}`}
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
            <Button variant={'ghost'} onClick={handleGoBack}>
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

        {/* Video Player */}
        <HTMLVideoPlayer url={videoSrc} videoRef={videoRef} />

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

            <span>{formatTime(duration - currentTime)}</span>
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
                {isPlaying ? <Pause /> : <PlayIcon />}
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
              {video.audioTracks && video.subtitleTracks && (
                <>
                  <DropdownWrapper
                    content={{
                      items: [
                        {
                          items: video.audioTracks.map((track) => ({
                            title: `${track.displayTitle} (${track.language})`,
                            action: () => {
                              setSelectedAudioTrack(track)
                              setVideoStart(currentTime)
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
                          items: video.subtitleTracks.map((track) => ({
                            title: `${track.displayTitle} (${track.language})`,
                            action: () => {
                              setSelectedSubtitleTrack(track)
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
                </>
              )}
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
