import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import {
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
  StopIcon,
} from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { Slider } from '@/components/ui/slider'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { ChevronDown, Repeat, Repeat1, Volume2, VolumeOff } from 'lucide-react'
import React, { useRef, useState } from 'react'
import useSWR from 'swr'
import './MusicControls.css'

function MusicControls() {
  const {
    currentSong,
    setMusicPlayerContracted,
    musicPlayerContracted,
    isPlaying,
    setIsPlaying,
  } = useMusicStore()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [previewTime, setPreviewTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [wasPaused, setWasPaused] = useState(false)
  const [volume, setVolume] = useState<number>(1)
  const [prevVolume, setPrevVolume] = useState<number>(1)
  const [repeatState, setRepeatState] = useState<'none' | 'one' | 'all'>('none')
  const { serverIP } = useServerStore()

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong
      ? `https://${serverIP}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  if (!album || !currentSong) return null

  const handleTimelineUpdate = (e: any) => {
    if (!timelineRef.current) return

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
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const percent =
      Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width

    const scrubbing = (e.buttons & 1) === 1
    setIsScrubbing(scrubbing)

    if (scrubbing) {
      setWasPaused(currentTime > 0)
      setCurrentTime(0)
    } else {
      setCurrentTime(percent * duration)
      if (!wasPaused) setCurrentTime(percent * duration)
    }

    handleTimelineUpdate(e)
  }

  //   const skip = (duration: number) => {
  //     const platy = videoRef.current
  //     if (!video) return

  //     video.currentTime += duration
  //   }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const handleChangeRepeatState = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRepeatState((prev) => {
      if (prev === 'none') return 'all'
      if (prev === 'all') return 'one'
      return 'none'
    })
  }

  return (
    <FlexBox
      direction="column"
      width={'100%'}
      className="fixed"
      css={{ height: '5rem' }}
      onClick={() => setMusicPlayerContracted(!musicPlayerContracted)}
    >
      {/* Timeline */}
      <div className="timeline-container w-full">
        <div className="timeline">
          <div className="preview-time">
            <span>{formatTime(previewTime)}</span>
          </div>
          <div className="thumb-indicator"></div>
        </div>
      </div>
      <FlexBox
        direction="row"
        justify="space-between"
        align="center"
        css={{ backgroundColor: 'var(--background)' }}
        width={'100%'}
        height={'100%'}
        padding="0.3rem"
        gap={2}
      >
        <FlexBox justify="start" align="center" gap={0.5}>
          <Button variant="ghost" size={'icon'}>
            <PrevTrackIcon />
          </Button>
          <Button
            variant="ghost"
            size={'icon'}
            onClick={(e) => {
              e.stopPropagation()
              setIsPlaying(!isPlaying)
            }}
          >
            {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
          </Button>
          <Button variant="ghost" size={'icon'}>
            <NextTrackIcon />
          </Button>
          <Button variant="ghost" size={'icon'}>
            <StopIcon />
          </Button>
          <span className="text-xs" style={{ color: 'lightgrey' }}>
            00:00 / {formatTime(currentSong.duration ?? 0)}
          </span>
        </FlexBox>
        <FlexBox justify="start" align="center" gap={1}>
          {musicPlayerContracted && (
            <LazyImage
              url={album.coverSrc}
              alt={currentSong.title}
              width={50}
              height={50}
            />
          )}
          <FlexBox direction="column" justify="center">
            <span>{currentSong?.title}</span>
            <span>
              {/* {currentSong?.collection.name} • {currentSong?.album.name}{' '} */}
              {album.title} {album.year}
            </span>
          </FlexBox>
        </FlexBox>
        <FlexBox justify="end" align="center" width={'20rem'} gap={0.5}>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            onClick={(e) => e.stopPropagation()}
            className="w-20"
          />
          <Button
            variant="ghost"
            size={'icon'}
            onClick={(e) => {
              e.stopPropagation()
              setVolume(volume === 0 ? prevVolume : 0)
              setPrevVolume(volume)
            }}
          >
            {volume === 0 ? <VolumeOff size={20} /> : <Volume2 size={20} />}
          </Button>
          <Button
            variant="ghost"
            size={'icon'}
            onClick={handleChangeRepeatState}
          >
            {repeatState === 'none' ? (
              <Repeat size={20} style={{ color: 'lightgray' }} />
            ) : repeatState === 'all' ? (
              <Repeat size={20} />
            ) : (
              <Repeat1 size={20} />
            )}
          </Button>
          <Button
            onClick={() => setMusicPlayerContracted(!musicPlayerContracted)}
            size={'icon'}
            variant="ghost"
          >
            <ChevronDown
              className={`${musicPlayerContracted ? 'rotateRight' : 'rotateBack'}`}
            />
          </Button>
        </FlexBox>
      </FlexBox>
    </FlexBox>
  )
}

export default MusicControls
