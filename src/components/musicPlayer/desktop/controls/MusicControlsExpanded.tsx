import CustomSlider from '@/components/CustomSlider'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
  StopIcon,
} from '@/components/ui/IconLibrary'
import { Slider } from '@/components/ui/slider'
import useMusicStore from '@/context/music.context'
import { RepeateMode } from '@/data/enums/Music'
import { formatTime } from '@/utils/ReactUtils'
import {
  ListMusic,
  Maximize2,
  MicVocal,
  Minimize2,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import Image from '@/components/ui/Image'
import { useState } from 'react'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { useTranslation } from 'react-i18next'

interface MusicControlsExpandedProps {
  title: string
  subtitle: string
}

function MusicControlsExpanded({
  title,
  subtitle,
}: MusicControlsExpandedProps) {
  const {
    album,
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
    seekTo,
    setVolume,
    setIsShuffling,
    togglePlayPause,
    setPrevVolume,
    handlePrevious,
    handleNext,
    isExpanded,
    setIsExpanded,
    resetPlayerState,
    handleChangeRepeatState,
  } = useMusicStore()
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [coverHover, setCoverHover] = useState<boolean>(false)

  const handleProgressChange = (progressValue: number) => {
    if (duration > 0) {
      const timeInSeconds = (progressValue / 100) * duration
      seekTo(timeInSeconds)
    }
  }

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0])
  }

  return (
    <div
      className={`bottom-0 flex h-25 min-h-25 w-screen flex-row items-center justify-between gap-5 bg-black px-6 backdrop-blur-sm transition-all duration-600 ease-in-out`}
    >
      {/* Info de la canción */}
      <div className="flex flex-1 items-center space-x-4">
        <div
          className="relative"
          onMouseEnter={() => setCoverHover(true)}
          onMouseLeave={() => setCoverHover(false)}
        >
          <div className="h-20 w-20">
            <Image
              url={album?.coverSrc ?? ''}
              alt={'Song Cover Image'}
              aspectRatio={1}
              height={20}
              className={`rounded-sm object-cover shadow-xl shadow-black/20 transition-all duration-500 ease-in-out`}
              fallbackSrc={''}
            />
          </div>

          {coverHover && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-black/80 text-white hover:bg-black/90"
              >
                {isExpanded ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-start space-x-4">
          <div className="truncate font-semibold text-white">{title}</div>
          <div className="text-sm text-white/70">{subtitle}</div>
        </div>
      </div>

      {isMobile ? (
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => resetPlayerState()}
            className="h-15 w-15 rounded-full text-white hover:bg-white/20"
          >
            <StopIcon size={28} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="h-15 w-15 rounded-full text-white hover:bg-white/20"
          >
            {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
          </Button>
        </div>
      ) : (
        <>
          {/* Central Controls */}
          <div
            className={`flex w-full flex-col items-center ${isTablet ? 'max-w-80' : 'max-w-150'}`}
          >
            {/* Controles centrales */}
            <div className={`flex items-center space-x-4`}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white/20"
                title={t('shuffle')}
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
                onClick={() => resetPlayerState()}
                className="rounded-full text-white hover:bg-white/20"
                title={t('stop')}
              >
                <StopIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="rounded-full text-white hover:bg-white/20"
                title={t('previous')}
              >
                <PrevTrackIcon size={22} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="h-15 w-15 rounded-full text-white hover:bg-white/20"
                title={isPlaying ? t('pause') : t('play')}
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
                title={t('next')}
              >
                <NextTrackIcon size={22} />
              </Button>
              <Button
                variant="ghost"
                size={'icon'}
                onClick={handleChangeRepeatState}
                className="rounded-full text-white hover:bg-white/20"
                title={t('repeat')}
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
              <span className="w-12 text-right">
                {currentTime ? formatTime(currentTime) : '00:00'}
              </span>
              <CustomSlider
                value={progress}
                buffered={buffered}
                onChange={handleProgressChange}
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Buttons */}
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowLyrics(!showLyrics)}
              title={t('lyrics')}
            >
              <MicVocal
                className="h-5 w-5"
                style={{ color: showLyrics ? 'var(--app-color)' : '' }}
              />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowQueue(!showQueue)}
              title={t('queue')}
            >
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
              title={volume === 0 ? t('unmute') : t('mute')}
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
        </>
      )}
    </div>
  )
}

export default MusicControlsExpanded
