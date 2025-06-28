import { Button } from '@/components/ui/button'
import { PauseIcon, PlayIcon, StopIcon } from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { Square, Pause, Play } from 'lucide-react'

interface MinimizedBarProps {
  barOpacity: number
  handleMouseDown: (e: React.MouseEvent) => void
  handleTouchStart: (e: React.TouchEvent) => void
  handleBarClick: (e: React.MouseEvent) => void
}

function MinimizedBar({
  barOpacity,
  handleMouseDown,
  handleTouchStart,
  handleBarClick,
}: MinimizedBarProps) {
  const {
    isExpanded,
    isPlaying,
    currentSong,
    album,
    togglePlayPause,
    selectSong,
  } = useMusicStore()
  return (
    <div
      className="absolute inset-0 cursor-pointer bg-black shadow-lg"
      style={{
        opacity: barOpacity,
        pointerEvents: isExpanded ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleBarClick}
    >
      <div className="flex h-full items-center px-4 text-white">
        <div className="flex min-w-0 flex-1 items-center pl-20">
          <div className="text-sm">
            <div className="truncate text-lg font-black">
              {currentSong?.title}
            </div>
            <div className="truncate text-sm font-bold text-gray-200">
              {album?.title}
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center space-x-3">
          <Button
            variant={'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              selectSong(null)
            }}
            className="rounded-full"
          >
            <StopIcon size={18} />
          </Button>

          <Button
            variant={'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              togglePlayPause
            }}
            className="rounded-full"
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MinimizedBar
