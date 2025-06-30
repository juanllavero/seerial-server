import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import useMusicStore from '@/context/music.context'
import { formatTime } from '@/utils/ReactUtils'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { shallow } from 'zustand/shallow'

interface DesktopCompactControlsProps {
  isHovered: boolean
  handlePrevious: () => void
  handlePlayPause: () => void
  handleNext: () => void
}

function DesktopCompactControls({
  isHovered,
  handlePrevious,
  handlePlayPause,
  handleNext,
}: DesktopCompactControlsProps) {
  const {
    isPlaying,
    progress,
    seekTo,
    volume,
    setVolume,
    isExpanded,
    duration,
    currentTime,
  } = useMusicStore(
    (state) => ({
      isPlaying: state.isPlaying,
      progress: state.progress,
      seekTo: state.seekTo,
      volume: state.volume,
      isExpanded: state.isExpanded,
      duration: state.duration,
      currentTime: state.currentTime,
      setVolume: state.setVolume,
    }),
    shallow,
  )
  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  const handleProgressChange = (progressValue: number[]) => {
    if (duration > 0) {
      const timeInSeconds = (progressValue[0] / 100) * duration
      seekTo(timeInSeconds)
    }
  }

  return (
    <div
      className={`transition-all duration-500 ${
        isExpanded
          ? 'pointer-events-none absolute opacity-0 transition-none'
          : 'opacity-100'
      }`}
    >
      {/* Slider de progreso compacto (aparece en hover) */}
      <div
        className={`overflow-hidden px-4 transition-all duration-300 ${
          isHovered ? 'max-h-30 opacity-100' : 'max-h-0 opacity-0'
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
