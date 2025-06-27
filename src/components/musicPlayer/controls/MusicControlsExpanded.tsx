import CustomSlider from '@/components/CustomSlider'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
} from '@/components/ui/IconLibrary'
import { Slider } from '@/components/ui/slider'
import useMusicStore from '@/context/music.context'
import { RepeateMode } from '@/data/enums/Music'
import { formatTime } from '@/utils/ReactUtils'
import {
  Heart,
  ListMusic,
  MicVocal,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeOff,
} from 'lucide-react'

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
  const isMobile = useIsMobile()
  const {
    isPlaying,
    isShuffling,
    repeateMode,
    prevVolume,
    showLyrics,
    showQueue,
    setShowQueue,
    setShowLyrics,
    volume,
    progress,
    buffered,
    currentTime,
    duration,
    isExpanded,
    setProgress,
    setVolume,
    setIsShuffling,
    setPrevVolume,
  } = useMusicStore()

  const handleProgressChange = (progress: number) => {
    setProgress(progress)
  }

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  return (
    <div
      className={`transition-all delay-200 duration-600 ease-in-out ${
        isExpanded
          ? `flex h-30 min-h-30 w-full translate-y-0 items-center justify-between gap-5 bg-black/100 px-6 opacity-100 backdrop-blur-sm`
          : 'pointer-events-none absolute translate-y-8 opacity-0 transition-none'
      }`}
    >
      {/* Info de la canción */}
      <div className="flex flex-1 flex-col items-start space-x-4">
        <div className="truncate font-semibold text-white">{title}</div>
        <div className="text-sm text-white/70">{subtitle}</div>
      </div>

      <div className="flex w-full max-w-150 flex-col items-center gap-1">
        {/* Controles centrales */}
        <div
          className={`flex items-center ${isMobile ? 'space-x-7' : 'space-x-4'}`}
        >
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
            <PrevTrackIcon size={22} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-15 w-15 rounded-full text-white hover:bg-white/20"
          >
            {isPlaying ? (
              <PauseIcon size={isMobile ? 54 : 44} />
            ) : (
              <PlayIcon size={isMobile ? 54 : 44} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="rounded-full text-white hover:bg-white/20"
          >
            <NextTrackIcon size={22} />
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

        {/* Progress Slider */}
        <div className="flex w-full items-center gap-2 text-sm">
          <span>{formatTime(currentTime)}</span>
          <CustomSlider
            value={progress}
            buffered={buffered}
            onChange={handleProgressChange}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-2">
        <Button variant="ghost" onClick={() => setShowLyrics(!showLyrics)}>
          <MicVocal
            className="h-5 w-5"
            style={{ color: showLyrics ? 'var(--app-color)' : '' }}
          />
        </Button>
        <Button variant="ghost" onClick={() => setShowQueue(!showQueue)}>
          <ListMusic
            className="h-5 w-5"
            style={{ color: showQueue ? 'var(--app-color)' : '' }}
          />
        </Button>
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
  )
}

export default MusicControlsExpanded
