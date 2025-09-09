import DropdownWrapper from '@/components/DropdownWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Video } from '@/data/interfaces/Media'
import { AudioTrack, SubtitleTrack } from '@/data/interfaces/MediaInfo'
import { formatTime } from '@/utils/ReactUtils'
import { TrackPreviousIcon, TrackNextIcon } from '@radix-ui/react-icons'
import {
  Pause,
  PlayIcon,
  Music2,
  Captions,
  Volume1,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import { MouseEventHandler, useState } from 'react'

interface ControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  timelineRef: React.RefObject<HTMLDivElement | null>
  video: Video
  isPlaying: boolean
  togglePlay: () => void
  toggleMute: () => void
  volume: number
  setVolume: (value: number) => void
  handleSubtitleTrackChange: (track: SubtitleTrack | null) => void
  handleAudioTrackChange: (track: AudioTrack) => void
  currentTime: number
  duration: number
  previewTime: number
  handleTimelineUpdate: (event: React.MouseEvent<HTMLDivElement>) => void
  toggleScrubbing: MouseEventHandler<HTMLDivElement>
  showControls: boolean
  setInControls: (value: boolean) => void
}

function Controls({
  videoRef,
  timelineRef,
  video,
  isPlaying,
  togglePlay,
  toggleMute,
  volume,
  setVolume,
  handleSubtitleTrackChange,
  handleAudioTrackChange,
  currentTime,
  duration,
  previewTime,
  handleTimelineUpdate,
  toggleScrubbing,
  showControls,
  setInControls,
}: ControlsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Gets the end time of the video
  const getEndTime = (currentSecond: number) => {
    const remainingTime = duration - currentSecond
    const now = new Date()
    const endTime = new Date(now.getTime() + remainingTime * 1000)

    const hours = endTime.getHours().toString().padStart(2, '0')
    const minutes = endTime.getMinutes().toString().padStart(2, '0')

    return `${hours}:${minutes}`
  }

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

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const videoPlayer = videoRef.current
    if (!videoPlayer) return

    const newVolume = Number(event.target.value)

    setVolume(newVolume)
    videoPlayer.volume = newVolume

    const percent = newVolume * 100
    event.target.style.background = `linear-gradient(to right, var(--app-color) ${percent}%, white ${percent}%)`
  }

  return (
    <FlexBox
      direction="column"
      justify="center"
      align="center"
      width={'100%'}
      gap={0.8}
      onClick={(e) => e?.stopPropagation()}
      onMouseEnter={() => setInControls(true)}
      onMouseLeave={() => {
        if (!dropdownOpen) setInControls(false)
      }}
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
                onOpenChange={setDropdownOpen}
                content={{
                  items: [
                    {
                      items: video.audioTracks.map((track) => ({
                        title: `${track.displayTitle} (${track.language ?? track.languageTag}) ${track.id}`,
                        action: () => {
                          handleAudioTrackChange(track)
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
                onOpenChange={setDropdownOpen}
                content={{
                  items: [
                    {
                      items: video.subtitleTracks.map((track) => ({
                        title: `${track.displayTitle} (${track.language ?? track.languageTag}) ${track.id}`,
                        action: () => {
                          handleSubtitleTrackChange(track)
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
  )
}

export default Controls
