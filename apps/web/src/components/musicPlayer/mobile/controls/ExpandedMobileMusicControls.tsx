import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { ChevronDown, ListMusic, MicVocal, Repeat, Repeat1, Shuffle } from 'lucide-react'
import { forwardRef } from 'react'
import { shallow } from 'zustand/shallow'
import CustomSlider from '@/components/CustomSlider'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import { Button } from '@/components/ui/button'
import {
  DolbyAtmosIcon,
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
} from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { RepeateMode } from '@/data/enums/Music'
import type { LRCFile } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/ReactUtils'

interface ExpandedMobileMusicControlsProps {
  controlsOpacity: number
  controlsTransform: string
  lyrics: LRCFile[]
}

const ExpandedMobileMusicControls = forwardRef<HTMLDivElement, ExpandedMobileMusicControlsProps>(
  ({ controlsOpacity, controlsTransform, lyrics }, ref) => {
    const {
      album,
      currentSong,
      isPlaying,
      isLoading,
      progress,
      buffered,
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
      setIsShuffling,
      setShowLyrics,
      setShowQueue,
      seekTo,
      setIsExpanded,
    } = useMusicStore(
      (state) => ({
        album: state.album,
        currentSong: state.currentSong,
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        progress: state.progress,
        buffered: state.buffered,
        showLyrics: state.showLyrics,
        showQueue: state.showQueue,
        duration: state.duration,
        currentTime: state.currentTime,
        isShuffling: state.isShuffling,
        repeateMode: state.repeateMode,
        handleChangeRepeatState: state.handleChangeRepeatState,
        handleNext: state.handleNext,
        handlePrevious: state.handlePrevious,
        togglePlayPause: state.togglePlayPause,
        setIsShuffling: state.setIsShuffling,
        setPrevVolume: state.setPrevVolume,
        setShowLyrics: state.setShowLyrics,
        setShowQueue: state.setShowQueue,
        seekTo: state.seekTo,
        setIsExpanded: state.setIsExpanded,
      }),
      shallow,
    )

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
      <div className="absolute inset-0 flex flex-col justify-between text-white" ref={ref}>
        {/* Header con botones de cerrar */}
        <div className="flex h-20 w-full items-center justify-between px-5 pt-2">
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

        {/* Espaciador flexible para empujar los controles hacia abajo */}
        <div className="flex-1" />

        {/* Controles principales - posicionados en la parte inferior */}
        <div
          className="px-6 pb-6"
          data-controls-content
          style={{
            opacity: controlsOpacity,
            transform: controlsTransform,
          }}
        >
          {/* Información de la canción */}
          <div className="mb-8 text-left">
            <h2 className="mb-2 text-3xl font-black text-white">{currentSong?.title}</h2>
            <p className="mb-6 text-lg font-semibold text-gray-200">{album?.title}</p>

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
          </div>

          {/* Controles principales de reproducción */}
          <div className="mb-6 flex items-center justify-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/20"
              onClick={() => setIsShuffling(!isShuffling)}
            >
              <Shuffle size={28} style={{ color: isShuffling ? 'var(--app-color)' : '' }} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="rounded-full text-white hover:bg-white/20"
            >
              <PrevTrackIcon size={32} />
            </Button>

            <button onClick={togglePlayPause} className="rounded-full bg-white p-5">
              {isLoading ? (
                <SmallSpinner size={36} />
              ) : isPlaying ? (
                <PauseIcon size={36} color="#080808" />
              ) : (
                <PlayIcon size={36} color="#080808" />
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
                <Repeat size={28} />
              ) : repeateMode === RepeateMode.REPEAT_ALL ? (
                <Repeat size={28} style={{ color: 'var(--app-color)' }} />
              ) : (
                <Repeat1 size={28} style={{ color: 'var(--app-color)' }} />
              )}
            </Button>
          </div>

          {/* Controles secundarios */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              disabled={lyrics.length === 0}
              className="rounded-full text-white hover:bg-white/20"
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <MicVocal
                className="h-5 w-5"
                style={{ color: showLyrics ? 'var(--app-color)' : '' }}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/20"
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
  },
)

ExpandedMobileMusicControls.displayName = 'ExpandedMobileMusicControls'

export default ExpandedMobileMusicControls
