import { shallow } from 'zustand/shallow'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import { Button } from '@/components/ui/button'
import { PauseIcon, PlayIcon, StopIcon } from '@/components/ui/IconLibrary'
import { useMusicStore } from '@seerial/stores'

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
    isLoading,
    currentSong,
    album,
    togglePlayPause,
    resetPlayerState,
  } = useMusicStore(
    (state) => ({
      isExpanded: state.isExpanded,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      currentSong: state.currentSong,
      album: state.album,
      togglePlayPause: state.togglePlayPause,
      resetPlayerState: state.resetPlayerState,
    }),
    shallow,
  )

  return (
    <div
      className="absolute inset-0 cursor-pointer bg-black shadow-lg"
      style={{
        opacity: barOpacity,
        pointerEvents: isExpanded ? 'none' : 'auto',
      }}
    >
      <div
        className="flex h-full items-center px-4 text-white"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Song info */}
        <div
          className="min-w-0 flex-1 pr-3 pl-18"
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown(e)
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            handleTouchStart(e)
          }}
          onClick={handleBarClick}
        >
          <div className="text-sm">
            <div className="truncate text-lg font-black">{currentSong?.title}</div>
            <div className="truncate text-sm font-bold text-gray-200">{album?.title}</div>
          </div>
        </div>

        {/* Control buttons */}
        <div
          className="flex flex-shrink-0 items-center space-x-3"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Button
            variant={'ghost'}
            onClick={resetPlayerState}
            onTouchEnd={(e) => {
              e.preventDefault()
              resetPlayerState()
            }}
            className="rounded-full"
          >
            <StopIcon size={18} />
          </Button>

          <Button
            variant={'ghost'}
            onClick={togglePlayPause}
            onTouchEnd={(e) => {
              e.preventDefault()
              togglePlayPause()
            }}
            className="rounded-full"
          >
            {isLoading ? (
              <SmallSpinner size={18} />
            ) : isPlaying ? (
              <PauseIcon size={18} />
            ) : (
              <PlayIcon size={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MinimizedBar
