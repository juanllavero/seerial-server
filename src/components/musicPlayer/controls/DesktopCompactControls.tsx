import { Button } from '@/components/ui/button'
import { formatTime } from '@/utils/ReactUtils'
import { Slider } from '@/components/ui/slider'
import { SkipBack, Pause, Play, SkipForward, Volume2 } from 'lucide-react'
import { useState } from 'react'

interface DesktopCompactControlsProps {
  isPlaying: boolean
  isHovered: boolean
  handlePrevious: () => void
  handlePlayPause: () => void
  handleNext: () => void
  isExpanded: boolean
  duration: number
  currentTime: number
}

function DesktopCompactControls({
  isPlaying,
  handlePrevious,
  handlePlayPause,
  handleNext,
  isHovered,
  isExpanded,
  duration,
  currentTime,
}: DesktopCompactControlsProps) {
  const [volume, setVolume] = useState(75)
  const [progress, setProgress] = useState(0)

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  const handleProgressChange = (progress: number[]) => {
    setProgress(progress[0])
  }

  return (
    <div
      className={`transition-all duration-500 ${
        isExpanded ? 'pointer-events-none absolute opacity-0' : 'opacity-100'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="text-white hover:bg-gray-100 hover:text-black"
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          className="h-10 w-10 text-white hover:bg-gray-100 hover:text-black"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="text-white hover:bg-gray-100 hover:text-black"
        >
          <SkipForward className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-white text-shadow-lg" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-16 text-shadow-lg [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-gray-400 [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-300 [&>span:first-child_span]:bg-white"
          />
        </div>
      </div>

      {/* Slider de progreso compacto (aparece en hover) */}
      <div
        className={`overflow-hidden px-4 transition-all duration-300 ${
          isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-2 pb-2">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={1}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-gray-400 [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-300 [&>span:first-child_span]:bg-white"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesktopCompactControls
