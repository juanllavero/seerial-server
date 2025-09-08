import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Video } from '@/data/interfaces/Media'
import { AudioTrack, SubtitleTrack } from '@/data/interfaces/MediaInfo'
import { getAudioTrack, getSubtitleTrack } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import HTMLVideoPlayer from './components/HTMLVideoPlayer'
import './VideoPlayerPage.css'
import Controls from './components/Controls'
import TopBar from './components/TopBar'

interface VideoInfo {
  title: string
  subtitle: string
  preferAudioLan: string
  preferSubtitleLan: string
  subsMode: string
}

function VideoPlayerPage() {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { videoId } = useParams()

  // Get video data
  const {
    data: video,
    isLoading: loadingVideo,
    mutate,
  } = useSWR<Video>(
    videoId && serverUrl !== ''
      ? `${serverUrl}/details/video?id=${videoId}`
      : null,
    fetcher,
  )

  // Get video info
  const { data: videoInfo, isLoading: loadingVideoInfo } = useSWR<VideoInfo>(
    videoId && serverUrl !== '' ? `${serverUrl}/videoInfo?id=${videoId}` : null,
    fetcher,
  )

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLoadingCircle, setShowLoadingCircle] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [duration, setDuration] = useState(video ? video.runtime * 60 : 0)
  const [timeOffset, setTimeOffset] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [previewTime, setPreviewTime] = useState(0)

  // State for triggering stream reload
  const [streamStartTime, setStreamStartTime] = useState(0)

  // Controls
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showControls, setShowControls] = useState(false)

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
    if (!video?.fileSrc || !serverUrl) return ''

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

    return `${serverUrl}/stream-video?${params.toString()}`
  }, [
    serverUrl,
    video,
    streamStartTime,
    selectedAudioTrack,
    selectedSubtitleTrack,
  ])

  // These functions now correctly update the state to trigger the 'videoSrc' recalculation.
  const handleAudioTrackChange = (track: AudioTrack) => {
    if (!videoRef.current) return
    setStreamStartTime(currentTime)
    setSelectedAudioTrack(track)
  }

  const handleSubtitleTrackChange = (track: SubtitleTrack | null) => {
    if (!videoRef.current) return
    setStreamStartTime(currentTime)
    setSelectedSubtitleTrack(track)
  }

  //#region Player Controls

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

  const skip = (offset: number) => {
    if (!videoRef.current) return
    const newTime = currentTime + offset
    if (newTime < 0) return

    setTimeOffset(newTime)
    setStreamStartTime(newTime)
  }
  //#endregion

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
    if (!videoRef.current || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width

    const scrubbing = (e.buttons & 1) === 1
    setIsScrubbing(scrubbing)

    if (scrubbing) {
      setWasPaused(videoRef.current.paused)
      videoRef.current.pause()
    } else {
      const seekTarget = percent * duration
      setTimeOffset(seekTarget)
      setStreamStartTime(seekTarget)
      if (!wasPaused) videoRef.current.play()
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
      if (!showControls) setShowControls(false)
    }, 2000)
  }

  const handleMouseLeave = () => {
    setShowControls(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }
  //#endregion

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

  // On video loaded
  useEffect(() => {
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      if (!isScrubbing) {
        const relativeTime = videoPlayer.currentTime
        const currentTime = timeOffset + relativeTime
        setCurrentTime(currentTime)
        timelineRef.current?.style.setProperty(
          '--progress-position',
          (currentTime / duration).toString(),
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
      setDuration(video ? video.runtime * 60 : 0)
    }
    const onLoadStart = () => {
      setShowLoadingCircle(true)
    }

    const onWaiting = () => {
      setShowLoadingCircle(true)
    }

    const onCanPlay = () => {
      setShowLoadingCircle(false)
    }

    const onPlaying = () => {
      setShowLoadingCircle(false)
    }

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
    videoPlayer.addEventListener('loadstart', onLoadStart)
    videoPlayer.addEventListener('canplay', onCanPlay)
    videoPlayer.addEventListener('timeupdate', onTimeUpdate)
    videoPlayer.addEventListener('loadeddata', onLoadedData)
    videoPlayer.addEventListener('waiting', onWaiting)
    videoPlayer.addEventListener('playing', onPlaying)
    window.addEventListener('keydown', onKeyDown)

    // Cleanup function
    return () => {
      videoPlayer.removeEventListener('play', onPlay)
      videoPlayer.removeEventListener('pause', onPause)
      videoPlayer.removeEventListener('loadstart', onLoadStart)
      videoPlayer.removeEventListener('canplay', onCanPlay)
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
      const result = await fetch(`${serverUrl}/updateMediaInfo`, {
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

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (isScrubbing) toggleScrubbing(e)
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) handleTimelineUpdate(e)
    }

    if (isScrubbing) {
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isScrubbing])

  useEffect(() => {
    if (!videoRef.current || !selectedSubtitleTrack) return
    const videoPlayer = videoRef.current

    const currentTime = videoPlayer.currentTime

    // Clear existing tracks
    Array.from(videoPlayer.querySelectorAll('track')).forEach((t) => t.remove())

    const track = document.createElement('track')
    track.kind = 'subtitles'
    track.label = selectedSubtitleTrack.displayTitle
    track.srclang = selectedSubtitleTrack.language
    track.src = `${serverUrl}/subs-from-video?path=${encodeURIComponent(video?.fileSrc ?? '')}&trackId=${selectedSubtitleTrack.id - (video?.subtitleTracks?.length ?? 0)}&startTime=${streamStartTime}`
    track.default = true

    videoPlayer.appendChild(track)

    // Forzar reanudar en el mismo tiempo
    videoPlayer.currentTime = currentTime
  }, [selectedSubtitleTrack, video])

  if (!video || loadingVideo || loadingVideoInfo) {
    return null
  }

  return (
    <>
      {/* Loading Circle */}
      {showLoadingCircle && (
        <div className="absolute z-50 flex h-screen w-screen justify-center">
          <Loading />
        </div>
      )}

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
        <TopBar
          video={video}
          videoRef={videoRef}
          videoInfo={videoInfo}
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          showControls={showControls}
          serverUrl={serverUrl}
          currentTime={currentTime}
          setVideoLoaded={setVideoLoaded}
          setIsPlaying={setIsPlaying}
          handleFullscreen={handleFullscreen}
        />

        {/* Video Player */}
        <HTMLVideoPlayer url={videoSrc} videoRef={videoRef} />

        {/* Controls */}
        <Controls
          videoRef={videoRef}
          timelineRef={timelineRef}
          video={video}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          showControls={showControls}
          setInControls={setShowControls}
          toggleScrubbing={toggleScrubbing}
          handleTimelineUpdate={handleTimelineUpdate}
          currentTime={currentTime}
          duration={duration}
          previewTime={previewTime}
          volume={volume}
          setVolume={setVolume}
          toggleMute={toggleMute}
          handleSubtitleTrackChange={handleSubtitleTrackChange}
          handleAudioTrackChange={handleAudioTrackChange}
        />
      </div>
    </>
  )
}

export default VideoPlayerPage
