import { useGetSongLyrics } from '@seerial/api';
import type { LRCFile } from '@seerial/domain';
import { formatTimefrom '@seerial/domdomain
import
{
  useMusicStore;
  Volume;
  @seerial
  /;;;;;;;eorsst;
}
from;
'
  EllipsisVertical,
  ListMusic,
  Maximize2,
  MicVocal,
  Minimize2,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeOff,
ct';lucide-
import { useStatem 'react';
import { useTranslationslation }
react - i18next8next;
';
import { shallowrom 'zustzustandnshallow
import
{
  RepeateMode;
}
from;
('@/shared/data/enumsemusic');

import { useIsTablett } from 'dshared/hooks/use-tablet/use-tablet';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import CustomSlider from '@/shared/ui/custom-slider';
import {
  NextTrackIcon,
  PauseIcon,
  PlayIcon,
  PrevTrackIcon,
  StopIcon,
} from '@/shared/ui/icon-library';
import Image from '@/shared/ui/image';
import { Slider } from '@/shared/ui/slider';
import SmallSpinner from '@/shared/ui/small-spinner';

interface MusicControlsExpandedProps {
  title: string;
  subtitle: string;
}

function MusicControlsExpanded({ title, subtitle }: MusicControlsExpandedProps) {
  const {
    album,
    currentSong,
    isShown,
    isPlaying,
    isLoading,
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
  } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isShown: state.isShown,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      isShuffling: state.isShuffling,
      repeateMode: state.repeateMode,
      prevVolume: state.prevVolume,
      showLyrics: state.showLyrics,
      showQueue: state.showQueue,
      setShowQueue: state.setShowQueue,
      setShowLyrics: state.setShowLyrics,
      volume: state.volume,
      progress: state.progress,
      buffered: state.buffered,
      currentTime: state.currentTime,
      duration: state.duration,
      seekTo: state.seekTo,
      setVolume: state.setVolume,
      setIsShuffling: state.setIsShuffling,
      togglePlayPause: state.togglePlayPause,
      setPrevVolume: state.setPrevVolume,
      handlePrevious: state.handlePrevious,
      handleNext: state.handleNext,
      isExpanded: state.isExpanded,
      setIsExpanded: state.setIsExpanded,
      resetPlayerState: state.resetPlayerState,
      handleChangeRepeatState: state.handleChangeRepeatState,
    }),
    shallow,
  );
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [coverHover, setCoverHover] = useState<boolean>(false);

  // Get Lyrics in order to show lyrics button
  const { data: lyrics } = useGetSongLyrics<LRCFile[]>(currentSong?.id ?? '', {
    enabled: Boolean(currentSong?.id && isShown),
  });

  const handleProgressChange = (progressValue: number) => {
    if (duration > 0) {
      const timeInSeconds = (progressValue / 100) * duration;
      seekTo(timeInSeconds);
    }
  };

  const handleVolumeChange = (volume: number[]) => {
    setVolume(volume[0]);
  };

  return (
    <div
      className={`bottom-0 flex h-25 min-h-25 w-screen flex-row items-center justify-between gap-5 bg-black px-6 backdrop-blur-sm`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Info de la canción */}
      <div className={`flex flex-1 items-center space-x-4`}>
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
              className={`rounded-sm object-cover shadow-xl shadow-black/20`}
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
                {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        <div className={`flex flex-1 flex-col items-start space-x-4`}>
          <span className="line-clamp-2 font-semibold text-white">{title}</span>
          <div className="line-clamp-1 text-sm text-white/70">{subtitle}</div>
        </div>
      </div>

      {/* Central Controls */}
      <div className={`flex w-full flex-col items-center ${isTablet ? 'max-w-80' : 'max-w-180'}`}>
        {/* Controles centrales */}
        <div className={`flex items-center space-x-4`}>
          <Button
            variant="fullGhost"
            size="icon"
            className="rounded-full text-white"
            title={t('shuffle')}
            onClick={(e) => {
              e.stopPropagation();
              setIsShuffling(!isShuffling);
            }}
          >
            {isShuffling ? (
              <Shuffle
                size={20}
                style={{
                  color: 'var(--app-color)',
                }}
              />
            ) : (
              <Shuffle size={20} className="opacity-75 hover:opacity-100" />
            )}
          </Button>

          <Button
            variant="fullGhost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              resetPlayerState();
            }}
            className="rounded-full text-white opacity-75"
            title={t('stop')}
          >
            <StopIcon size={20} />
          </Button>

          <Button
            variant="fullGhost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="rounded-full text-white opacity-75"
            title={t('previous')}
          >
            <PrevTrackIcon size={20} />
          </Button>

          <Button
            variant="fullGhost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="h-15 w-15 rounded-full text-white"
            title={isPlaying ? t('pause') : t('play')}
          >
            {isLoading ? (
              <SmallSpinner />
            ) : isPlaying ? (
              <PauseIcon size={isMobile ? 54 : 44} />
            ) : (
              <PlayIcon size={isMobile ? 54 : 44} />
            )}
          </Button>

          <Button
            variant="fullGhost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="rounded-full text-white opacity-75"
            title={t('next')}
          >
            <NextTrackIcon size={20} />
          </Button>

          <Button
            variant="fullGhost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              resetPlayerState();
            }}
            className="rounded-full text-white opacity-75"
            title={t('stop')}
          >
            <EllipsisVertical size={20} />
          </Button>
          <Button
            variant="fullGhost"
            size={'icon'}
            onClick={(e) => {
              e.stopPropagation();
              handleChangeRepeatState(e);
            }}
            className="rounded-full text-white"
            title={t('repeat')}
          >
            {repeateMode === RepeateMode.NONE ? (
              <Repeat size={20} className="opacity-75 hover:opacity-100" />
            ) : repeateMode === RepeateMode.REPEAT_ALL ? (
              <Repeat size={20} style={{ color: 'var(--app-color)' }} />
            ) : (
              <Repeat1 size={20} style={{ color: 'var(--app-color)' }} />
            )}
          </Button>
        </div>

        {/* Progress Slider */}
        <div
          className="flex w-full items-center gap-2 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-12 text-right">{currentTime ? formatTime(currentTime) : '00:00'}</span>
          <CustomSlider value={progress} buffered={buffered} onChange={handleProgressChange} />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Buttons */}
      <div className="flex flex-1 items-center justify-end space-x-1">
        <Button
          variant="fullGhost"
          onClick={(e) => {
            e.stopPropagation();
            setShowLyrics(!showLyrics);
          }}
          disabled={!lyrics || lyrics.length === 0}
          size={'icon'}
          title={t('lyrics')}
        >
          <MicVocal className="h-5 w-5" style={{ color: showLyrics ? 'var(--app-color)' : '' }} />
        </Button>
        <Button
          variant="fullGhost"
          onClick={(e) => {
            e.stopPropagation();
            setShowQueue(!showQueue);
          }}
          size={'icon'}
          title={t('queue')}
        >
          <ListMusic className="h-5 w-5" style={{ color: showQueue ? 'var(--app-color)' : '' }} />
        </Button>
        <Button
          variant="fullGhost"
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation();
            setVolume(volume === 0 ? prevVolume : 0);
            setPrevVolume(volume);
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
          onClick={(e) => e.stopPropagation()}
          max={100}
          step={1}
          className="w-24 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&>span:first-child_span]:bg-white"
        />
      </div>
    </div>
  );
}

export default MusicControlsExpanded;
