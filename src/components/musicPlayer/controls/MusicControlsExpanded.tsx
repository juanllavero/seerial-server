import { Button } from '@/components/ui/button'
import { formatTime } from '@/utils/ReactUtils'
import { Slider } from '@/components/ui/slider'
import {
  Shuffle,
  SkipBack,
  Pause,
  Play,
  SkipForward,
  Repeat,
  Volume2,
  Repeat1,
  VolumeOff,
} from 'lucide-react'
import { useState } from 'react'
import {
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
} from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { RepeateMode } from '@/data/enums/Music'

interface MusicControlsExpandedProps {
  title: string
  subtitle: string
  handlePrevious: () => void
  handlePlayPause: () => void
  handleNext: () => void
  handleChangeRepeatState: (e: React.MouseEvent) => void
}

function MusicControlsExpanded({
  title,
  subtitle,
  handlePrevious,
  handlePlayPause,
  handleNext,
  handleChangeRepeatState,
}: MusicControlsExpandedProps) {
  const {
    isPlaying,
    isShuffling,
    repeateMode,
    prevVolume,
    volume,
    progress,
    currentTime,
    isExpanded,
    setProgress,
    setVolume,
    setIsShuffling,
    setPrevVolume,
    currentSong,
  } = useMusicStore()

  const handleProgressChange = (progress: number[]) => {
    setProgress(progress[0])
  }

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  return (
    <div
      className={`transition-all delay-200 duration-600 ease-in-out ${
        isExpanded
          ? 'h-[30dvh] translate-y-0 bg-black/30 p-6 opacity-100 backdrop-blur-sm'
          : 'pointer-events-none absolute translate-y-8 opacity-0 transition-none'
      }`}
    >
      {/* Slider de progreso expandido */}
      <div className="mb-4">
        <Slider
          value={[progress]}
          onValueChange={handleProgressChange}
          max={100}
          step={1}
          className="w-full [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&>span:first-child_span]:bg-white"
        />
        <div className="mt-1 flex justify-between text-sm text-white/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(currentSong ? currentSong.duration : 0)}</span>
        </div>
      </div>

      {/* Controles principales expandidos */}
      <div className="flex items-center justify-between">
        {/* Info de la canción */}
        <div className="flex flex-1 items-center space-x-4">
          <div>
            <div className="font-semibold text-white">{title}</div>
            <div className="text-sm text-white/70">{subtitle}</div>
          </div>
        </div>

        {/* Controles centrales */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/20"
            onClick={() => setIsShuffling(!isShuffling)}
          >
            <Shuffle
              className="h-5 w-5"
              style={{ color: isShuffling ? 'var(--app-color)' : '' }}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="rounded-full text-white hover:bg-white/20"
          >
            <PrevTrackIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-15 w-15 rounded-full text-white hover:bg-white/20"
          >
            {isPlaying ? <PauseIcon size={44} /> : <PlayIcon size={44} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="rounded-full text-white hover:bg-white/20"
          >
            <NextTrackIcon />
          </Button>
          <Button
            variant="ghost"
            size={'icon'}
            onClick={handleChangeRepeatState}
            className="rounded-full"
          >
            {repeateMode === RepeateMode.NONE ? (
              <Repeat size={20} />
            ) : repeateMode === RepeateMode.REPEAT_ALL ? (
              <Repeat size={20} style={{ color: 'var(--app-color)' }} />
            ) : (
              <Repeat1 size={20} style={{ color: 'var(--app-color)' }} />
            )}
          </Button>
        </div>

        {/* Control de volumen */}
        <div className="flex flex-1 items-center justify-end space-x-2">
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
            className="w-24 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&>span:first-child_span]:bg-white"
          />
        </div>
      </div>
    </div>
  )
}

export default MusicControlsExpanded
