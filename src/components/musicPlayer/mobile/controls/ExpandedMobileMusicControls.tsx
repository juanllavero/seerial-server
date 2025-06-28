import CustomSlider from '@/components/CustomSlider'
import { Button } from '@/components/ui/button'
import {
  PrevTrackIcon,
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
} from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { RepeateMode } from '@/data/enums/Music'
import { formatTime } from '@/utils/ReactUtils'
import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { Slider } from '@radix-ui/react-slider'
import {
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  MicVocal,
  VolumeOff,
  Volume2,
  ListMusic,
} from 'lucide-react'
import { forwardRef } from 'react'

interface ExpandedMobileMusicControlsProps {
  controlsOpacity: number
  controlsTransform: string
}

const ExpandedMobileMusicControls = forwardRef<
  HTMLDivElement,
  ExpandedMobileMusicControlsProps
>(({ controlsOpacity, controlsTransform }, ref) => {
  const {
    album,
    currentSong,
    isPlaying,
    progress,
    buffered,
    volume,
    prevVolume,
    showLyrics,
    showQueue,
    duration,
    currentTime,
    isShuffling,
    repeateMode,
    handleChangeRepeatState,
    handleNext,
    handlePrevious,
    togglePlayPause,
    setVolume,
    setIsShuffling,
    setPrevVolume,
    setShowLyrics,
    setShowQueue,
    seekTo,
    setIsExpanded,
  } = useMusicStore()

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  const handleProgressChange = (progressValue: number) => {
    if (duration > 0) {
      const timeInSeconds = (progressValue / 100) * duration
      seekTo(timeInSeconds)
    }
  }

  const handleCloseExpanded = () => {
    setIsExpanded(false)
  }

  return (
    <div
      className="absolute inset-0 content-end p-6 pt-16 text-white"
      ref={ref}
    >
      {/* Close Button */}
      <div
        className="absolute top-0 left-0 flex h-20 w-screen justify-between p-5"
        onClick={handleCloseExpanded}
      >
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-white hover:bg-white/20"
          onClick={handleCloseExpanded}
          style={{ opacity: controlsOpacity }}
        >
          <ChevronDown className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-white hover:bg-white/20"
          onClick={handleCloseExpanded}
          style={{ opacity: controlsOpacity }}
        >
          <DotsVerticalIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Song Info */}
      <div
        className="mt-80 text-left"
        style={{
          opacity: controlsOpacity,
          transform: controlsTransform,
        }}
      >
        <h2 className="mb-2 text-4xl font-black text-white">
          {currentSong?.title}
        </h2>
        <p className="mb-8 text-xl font-semibold text-gray-200">
          {album?.title}
        </p>

        {/* Progress Slider */}
        <div className="mb-2">
          <CustomSlider
            value={progress}
            buffered={buffered}
            accentColor="#FFFFFF"
            showKnob
            onChange={handleProgressChange}
          />
        </div>

        <div className="mb-8 flex justify-between text-sm text-gray-200">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controles principales */}
        <div className="mb-8 flex items-center justify-center space-x-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/20"
            onClick={() => setIsShuffling(!isShuffling)}
          >
            <Shuffle
              size={32}
              style={{ color: isShuffling ? 'var(--app-color)' : '' }}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="rounded-full text-white hover:bg-white/20"
          >
            <PrevTrackIcon size={32} />
          </Button>

          <button
            onClick={togglePlayPause}
            className="rounded-full bg-white p-6"
          >
            {isPlaying ? (
              <PauseIcon size={40} color="#080808" />
            ) : (
              <PlayIcon size={40} color="#080808" />
            )}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="rounded-full text-white hover:bg-white/20"
          >
            <NextTrackIcon size={32} />
          </Button>

          <Button
            variant="ghost"
            size={'icon'}
            onClick={handleChangeRepeatState}
            className="rounded-full text-white hover:bg-white/20"
          >
            {repeateMode === RepeateMode.NONE ? (
              <Repeat size={32} />
            ) : repeateMode === RepeateMode.REPEAT_ALL ? (
              <Repeat size={32} style={{ color: 'var(--app-color)' }} />
            ) : (
              <Repeat1 size={32} style={{ color: 'var(--app-color)' }} />
            )}
          </Button>
        </div>

        {/* Controles secundarios */}
        <div className="flex items-center justify-between py-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setShowLyrics(!showLyrics)}
          >
            <MicVocal
              className="h-5 w-5"
              style={{ color: showLyrics ? 'var(--app-color)' : '' }}
            />
          </Button>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation()
                setVolume(volume === 0 ? prevVolume : 0)
                setPrevVolume(volume)
              }}
            >
              {volume === 0 ? (
                <VolumeOff size={20} className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" size={20} />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-10 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&>span:first-child_span]:bg-white"
            />
          </div>

          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setShowQueue(!showQueue)}
          >
            <ListMusic
              className="h-5 w-5"
              style={{ color: showQueue ? 'var(--app-color)' : '' }}
            />
          </Button>
        </div>
      </div>
    </div>
  )
})

export default ExpandedMobileMusicControls
