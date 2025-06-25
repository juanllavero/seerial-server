import { Button } from '@/components/ui/button'
import { formatTime } from '@/utils/ReactUtils'
import { Slider } from '@radix-ui/react-slider'
import {
  Shuffle,
  SkipBack,
  Pause,
  Play,
  SkipForward,
  Repeat,
  Volume2,
} from 'lucide-react'
import { useState } from 'react'

interface MusicControlsExpandedProps {
  isExpanded: boolean
  currentTime: number
  title: string
  subtitle: string
  duration: number
  isPlaying: boolean
  handlePrevious: () => void
  handlePlayPause: () => void
  handleNext: () => void
}

function MusicControlsExpanded({
  isExpanded,
  currentTime,
  title,
  subtitle,
  duration,
  isPlaying,
  handlePrevious,
  handlePlayPause,
  handleNext,
}: MusicControlsExpandedProps) {
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(75)

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
          <span>{formatTime(duration)}</span>
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
            className="text-white hover:bg-white/20"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20"
          >
            <SkipBack className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-12 w-12 text-white hover:bg-white/20"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="text-white hover:bg-white/20"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Repeat className="h-5 w-5" />
          </Button>
        </div>

        {/* Control de volumen */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Volume2 className="h-5 w-5 text-white" />
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
