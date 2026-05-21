import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { Song } from '@seerial/domain';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { AudioLines, ForwardIcon, Languages, List, MicVocal, RewindIcon } from 'lucide-react';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import LyricsOptionsMenu from '@/features/music-player/lyrics-options-menu';
import TimelineSlider from '@/features/video-player/components/controls/timeline-slider';
import Loading from '@/shared/components/loading';
import { NavigationButton } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import { Slider } from '@/shared/components/ui/slider';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import QueueMenu from './queue-menu';
import SongInfo from './song-info';

const TEST_BACKGROUND_STYLE: 'classic' | 'background' = 'classic';

const KARAOKE_MIX_MIN = -10;
const KARAOKE_MIX_MAX = 10;
const PLAYER_CONTROLS_AUTO_HIDE_MS = 5000;

interface KaraokeMixSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

interface MusicPlayerControlsProps {
  t: (key: string) => string;
  currentSong: Song | null;
  playerState: {
    isExpanded: boolean;
    isShown: boolean;
    isPlaying: boolean;
    isLoading: boolean;
  };
  currentTime: number;
  playerDuration: number;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  togglePlayPause: () => Promise<void>;
  getActivePlaybackPosition: () => Promise<number>;
  getActivePlaybackDuration: () => Promise<number>;
  setActivePlaybackPosition: (position: number) => Promise<void>;
  lyricsState: {
    showLyrics: boolean;
    isLyricsButtonDisabled: boolean;
    isLyricsOptionsOpen: boolean;
    isLyricsOptionsButtonDisabled: boolean;
    hasLyrics: boolean;
    hasPronunciation: boolean;
    showPronunciation: boolean;
    hasTranslation: boolean;
    showTranslation: boolean;
  };
  setShowLyrics: (showLyrics: boolean) => void;
  setIsLyricsOptionsOpen: Dispatch<SetStateAction<boolean>>;
  setShowPronunciation: Dispatch<SetStateAction<boolean | null>>;
  setShowTranslation: (value: boolean) => void;
  closeLyricsOptions: (restoreFocus?: boolean) => void;
  karaokeState: {
    shouldShowKaraokeButton: boolean;
    isKaraokePreparing: boolean;
    isKaraokeActive: boolean;
    isKaraokeReady: boolean;
    isKaraokeAvailable: boolean;
    showKaraokeMixer: boolean;
  };
  karaokeMix: number;
  setShowKaraokeMixer: Dispatch<SetStateAction<boolean>>;
  handleKaraokeMixChange: (value: number) => Promise<void>;
  isQueueMenuOpen: boolean;
  setIsQueueMenuOpen: Dispatch<SetStateAction<boolean>>;
  songQueue: Song[];
  selectSong: (song: Song | null) => void;
}

function KaraokeMixSlider({ label, value, onChange }: KaraokeMixSliderProps) {
  const { ref, focused } = useFocusable({
    focusKey: NavigationFocusKeys.player.karaokeSlider,
    onArrowPress: (direction) => {
      if (direction === 'left') {
        onChange(value - 1);
        return false;
      }

      if (direction === 'right') {
        onChange(value + 1);
        return false;
      }

      return true;
    },
  });

  return (
    <div
      ref={ref}
      className={`w-full max-w-[46vh] rounded-[2.5vh] border px-[2.4vh] py-[1.8vh] 
        backdrop-blur-md transition-all duration-200 
        ${
          focused
            ? 'border-white/90 bg-black/55 shadow-lg shadow-black/30'
            : 'border-white/20 bg-black/30'
        }`}
    >
      <FlexBox direction="column" width="100%" gap={0.8}>
        <FlexBox width="100%" justify="space-between" align="center">
          <span className="text-[1.8vh] font-medium text-white/80">{label}</span>
          <span className="text-[2.1vh] font-semibold text-white">{value}</span>
        </FlexBox>
        <Slider
          min={KARAOKE_MIX_MIN}
          max={KARAOKE_MIX_MAX}
          step={1}
          value={[value]}
          onValueChange={([nextValue]: number[]) => {
            if (typeof nextValue === 'number') {
              onChange(nextValue);
            }
          }}
          aria-label={label}
          className="py-1"
        />
        <FlexBox width="100%" justify="space-between" align="center">
          <span className="text-[1.5vh] text-white/55">Vocals mute</span>
          <span className="text-[1.5vh] text-white/55">Instrumental mute</span>
        </FlexBox>
      </FlexBox>
    </div>
  );
}

function KaraokeLoadingIcon() {
  return (
    <span className="inline-block size-[2.2dvh] animate-spin rounded-full border-2 border-current" />
  );
}

function MusicPlayerControlsContent({
  playerUi,
  currentTime,
  playerDuration,
  setCurrentTime,
  setDuration,
  handleTimelineFocusChange,
  togglePlayPause,
  getActivePlaybackPosition,
  getActivePlaybackDuration,
  setActivePlaybackPosition,
  queueState,
  karaokeUi,
  t,
  karaokeMix,
  handleKaraokeMixChange,
  currentSong,
  songQueue,
  handlePlayPrevious,
  handlePlayNextSong,
  toggleKaraokeMixer,
  lyricsUi,
  setIsLyricsOptionsOpen,
  setShowLyrics,
  setShowPronunciation,
  setShowTranslation,
  closeLyricsOptions,
}: {
  playerUi: {
    arePlayerControlsVisible: boolean;
    isLoading: boolean;
  };
  currentTime: number;
  playerDuration: number;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  handleTimelineFocusChange: (focused: boolean) => void;
  togglePlayPause: () => Promise<void>;
  getActivePlaybackPosition: () => Promise<number>;
  getActivePlaybackDuration: () => Promise<number>;
  setActivePlaybackPosition: (position: number) => Promise<void>;
  queueState: {
    isQueueMenuOpen: boolean;
    setIsQueueMenuOpen: Dispatch<SetStateAction<boolean>>;
  };
  karaokeUi: {
    showKaraokeMixer: boolean;
    isKaraokeAvailable: boolean;
    shouldShowKaraokeButton: boolean;
    isKaraokeActive: boolean;
    isKaraokeReady: boolean;
    isKaraokePreparing: boolean;
  };
  t: (key: string) => string;
  karaokeMix: number;
  handleKaraokeMixChange: (value: number) => Promise<void>;
  currentSong: Song | null;
  songQueue: Song[];
  handlePlayPrevious: () => void;
  handlePlayNextSong: () => void;
  toggleKaraokeMixer: () => void;
  lyricsUi: {
    isLyricsButtonDisabled: boolean;
    showLyrics: boolean;
    isLyricsOptionsOpen: boolean;
    isLyricsOptionsButtonDisabled: boolean;
    hasLyrics: boolean;
    hasPronunciation: boolean;
    showPronunciation: boolean;
    hasTranslation: boolean;
    showTranslation: boolean;
  };
  setIsLyricsOptionsOpen: Dispatch<SetStateAction<boolean>>;
  setShowLyrics: (showLyrics: boolean) => void;
  setShowPronunciation: Dispatch<SetStateAction<boolean | null>>;
  setShowTranslation: (value: boolean) => void;
  closeLyricsOptions: (restoreFocus?: boolean) => void;
}) {
  const { arePlayerControlsVisible, isLoading } = playerUi;
  const { isQueueMenuOpen, setIsQueueMenuOpen } = queueState;
  const {
    showKaraokeMixer,
    isKaraokeAvailable,
    shouldShowKaraokeButton,
    isKaraokeActive,
    isKaraokeReady,
    isKaraokePreparing,
  } = karaokeUi;
  const {
    isLyricsButtonDisabled,
    showLyrics,
    isLyricsOptionsOpen,
    isLyricsOptionsButtonDisabled,
    hasLyrics,
    hasPronunciation,
    showPronunciation,
    hasTranslation,
    showTranslation,
  } = lyricsUi;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-[3.5vh] z-30 flex justify-center px-[4vh] transition-opacity duration-300 linear ${
        arePlayerControlsVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-auto w-full max-w-[160dvh]">
        <div className="flex w-[160dvh] justify-between pb-4">
          {!!isLoading && (
            <div className="mb-[2vh] flex h-[7dvh] justify-center">
              <Loading />
            </div>
          )}

          <div className="flex justify-center pb-4">
            {TEST_BACKGROUND_STYLE === 'background' && <SongInfo />}
          </div>
        </div>

        <FlexBox direction="column" gap={2} align="center" width="100%">
          <TimelineSlider
            position={currentTime}
            setPosition={setCurrentTime}
            duration={playerDuration}
            setDuration={setDuration}
            onFocusChange={handleTimelineFocusChange}
            togglePlayPause={togglePlayPause}
            playbackControls={{
              getPosition: getActivePlaybackPosition,
              getDuration: getActivePlaybackDuration,
              setPosition: setActivePlaybackPosition,
            }}
          />

          <AnimatePresence initial={false}>
            <QueueMenu isOpen={isQueueMenuOpen} onClose={setIsQueueMenuOpen} />

            {showKaraokeMixer && isKaraokeAvailable && (
              <m.div
                key="karaoke-mix-slider"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pt-[1.5vh]"
              >
                <KaraokeMixSlider
                  label={t('karaokeMix')}
                  value={karaokeMix}
                  onChange={(nextValue) => {
                    void handleKaraokeMixChange(nextValue);
                  }}
                />
              </m.div>
            )}
          </AnimatePresence>

          <FlexBox gap={1} width={'100%'} justify="space-between" align="center" className="pt-4">
            <div className="flex gap-2">
              <NavigationButton
                customKey={NavigationFocusKeys.player.rewindButton}
                hideText
                onClick={handlePlayPrevious}
              >
                <RewindIcon fill="currentColor" size={'2vh'} />
              </NavigationButton>
              {currentSong && songQueue.length > songQueue.indexOf(currentSong) + 1 && (
                <NavigationButton
                  customKey={NavigationFocusKeys.player.forwardButton}
                  hideText
                  onClick={handlePlayNextSong}
                >
                  <ForwardIcon fill="currentColor" size={'2vh'} />
                </NavigationButton>
              )}
            </div>

            <div className="flex gap-2">
              {!!shouldShowKaraokeButton && (
                <NavigationButton
                  customKey={NavigationFocusKeys.player.karaokeButton}
                  title={t('karaokeMix')}
                  hideText
                  selected={showKaraokeMixer || isKaraokeActive}
                  disabled={!isKaraokeReady}
                  onClick={toggleKaraokeMixer}
                >
                  {isKaraokePreparing ? <KaraokeLoadingIcon /> : <AudioLines size={'2dvh'} />}
                </NavigationButton>
              )}

              <NavigationButton
                customKey={NavigationFocusKeys.player.lyricsButton}
                title={t('lyrics')}
                hideText
                disabled={isLyricsButtonDisabled}
                onClick={() => {
                  if (showLyrics) {
                    setIsLyricsOptionsOpen(false);
                  }

                  setShowLyrics(!showLyrics);
                }}
              >
                <MicVocal stroke={showLyrics ? 'var(--app-color)' : 'currentColor'} size={'2dvh'} />
              </NavigationButton>
              <div className="relative">
                <NavigationButton
                  customKey={NavigationFocusKeys.player.lyricsOptionsButton}
                  title={t('lyricsOptions')}
                  hideText
                  selected={isLyricsOptionsOpen}
                  disabled={isLyricsOptionsButtonDisabled || !hasLyrics}
                  onClick={() => {
                    setIsLyricsOptionsOpen((currentValue) => !currentValue);
                  }}
                >
                  <Languages size={'2dvh'} />
                </NavigationButton>

                <AnimatePresence initial={false}>
                  {isLyricsOptionsOpen && !isLyricsOptionsButtonDisabled && !!hasLyrics && (
                    <m.div
                      key="lyrics-options-menu"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute bottom-[calc(100%+1.4vh)] left-1/2 z-40 -translate-x-1/2"
                    >
                      <LyricsOptionsMenu
                        open={isLyricsOptionsOpen}
                        triggerFocusKey={NavigationFocusKeys.player.lyricsOptionsButton}
                        pronunciationOption={{
                          label: t('lyricsPronunciation'),
                          available: hasPronunciation,
                          selected: showPronunciation,
                        }}
                        translationOption={{
                          label: t('lyricsTranslation'),
                          available: hasTranslation,
                          selected: showTranslation,
                        }}
                        onTogglePronunciation={() => {
                          setShowPronunciation((currentValue) => !currentValue);
                        }}
                        onToggleTranslation={() => {
                          setShowTranslation(!showTranslation);
                        }}
                        onClose={() => closeLyricsOptions()}
                      />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <NavigationButton
                customKey={NavigationFocusKeys.player.openQueueButton}
                hideText
                selected={isQueueMenuOpen}
                onClick={() => setIsQueueMenuOpen(true)}
              >
                <List size={'2dvh'} />
              </NavigationButton>
            </div>
          </FlexBox>
        </FlexBox>
      </div>
    </div>
  );
}

function MusicPlayerControls({
  t,
  currentSong,
  playerState,
  currentTime,
  playerDuration,
  setCurrentTime,
  setDuration,
  togglePlayPause,
  getActivePlaybackPosition,
  getActivePlaybackDuration,
  setActivePlaybackPosition,
  lyricsState,
  setShowLyrics,
  setIsLyricsOptionsOpen,
  setShowPronunciation,
  setShowTranslation,
  closeLyricsOptions,
  karaokeState,
  karaokeMix,
  setShowKaraokeMixer,
  handleKaraokeMixChange,
  isQueueMenuOpen,
  setIsQueueMenuOpen,
  songQueue,
  selectSong,
}: MusicPlayerControlsProps) {
  const { isExpanded, isShown, isPlaying, isLoading } = playerState;
  const {
    showLyrics,
    isLyricsButtonDisabled,
    isLyricsOptionsOpen,
    isLyricsOptionsButtonDisabled,
    hasLyrics,
    hasPronunciation,
    showPronunciation,
    hasTranslation,
    showTranslation,
  } = lyricsState;
  const {
    shouldShowKaraokeButton,
    isKaraokePreparing,
    isKaraokeActive,
    isKaraokeReady,
    isKaraokeAvailable,
    showKaraokeMixer,
  } = karaokeState;

  const controlsHideTimeoutRef = useRef<number | null>(null);
  const isTimelineFocusedRef = useRef(false);

  const handleTimelineFocusChange = useCallback((focused: boolean) => {
    isTimelineFocusedRef.current = focused;
    if (focused) {
      setArePlayerControlsVisible(true);
    }
  }, []);
  const [arePlayerControlsVisible, setArePlayerControlsVisible] = useState(true);

  const clearControlsHideTimeout = useCallback(() => {
    if (controlsHideTimeoutRef.current !== null) {
      window.clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  }, []);

  const showPlayerControls = useCallback(() => {
    setArePlayerControlsVisible(true);
  }, []);

  const scheduleControlsAutoHide = useCallback(() => {
    clearControlsHideTimeout();

    if (!isExpanded || !isShown || !isTimelineFocusedRef.current || !isPlaying) {
      setArePlayerControlsVisible(true);
      return;
    }

    setArePlayerControlsVisible(true);
    controlsHideTimeoutRef.current = window.setTimeout(() => {
      setArePlayerControlsVisible(false);
      controlsHideTimeoutRef.current = null;
    }, PLAYER_CONTROLS_AUTO_HIDE_MS);
  }, [clearControlsHideTimeout, isExpanded, isShown, isPlaying]);

  const toggleKaraokeMixer = useCallback(() => {
    if (!isKaraokeReady || !isKaraokeAvailable) {
      return;
    }

    const nextValue = !showKaraokeMixer;
    setShowKaraokeMixer(nextValue);

    window.setTimeout(() => {
      setFocus(
        nextValue
          ? NavigationFocusKeys.player.karaokeSlider
          : NavigationFocusKeys.player.karaokeButton,
      );
    }, 30);
  }, [isKaraokeAvailable, isKaraokeReady, setShowKaraokeMixer, showKaraokeMixer]);

  const handlePlayNextSong = useCallback(() => {
    if (!currentSong) {
      return;
    }

    if (songQueue.length <= songQueue.indexOf(currentSong) + 1) {
      return;
    }

    const nextSong = songQueue[songQueue.indexOf(currentSong) + 1];
    selectSong(nextSong);
  }, [songQueue, selectSong, currentSong]);

  const handlePlayPrevious = useCallback(() => {
    if (!currentSong) {
      return;
    }

    const currentSongIndex = songQueue.indexOf(currentSong);
    if (currentSongIndex <= 0) {
      setCurrentTime(0);
      return;
    }

    const previousSong = songQueue[currentSongIndex - 1];
    selectSong(previousSong);
  }, [songQueue, selectSong, currentSong, setCurrentTime]);

  useEffect(() => {
    scheduleControlsAutoHide();

    return () => {
      clearControlsHideTimeout();
    };
  }, [clearControlsHideTimeout, scheduleControlsAutoHide]);

  const showPlayerControlsEvent = useEffectEvent(() => {
    showPlayerControls();
  });

  const scheduleControlsAutoHideEvent = useEffectEvent(() => {
    scheduleControlsAutoHide();
  });

  const clearControlsHideTimeoutEvent = useEffectEvent(() => {
    clearControlsHideTimeout();
  });

  useEffect(() => {
    if (!isShown || !isExpanded) {
      setArePlayerControlsVisible(true);
      clearControlsHideTimeoutEvent();
      return;
    }

    const handleControlsActivity = (e: KeyboardEvent) => {
      if (isTimelineFocusedRef.current && e.key === 'ArrowUp') {
        clearControlsHideTimeoutEvent();
        setArePlayerControlsVisible(false);
        return;
      }

      showPlayerControlsEvent();

      if (isTimelineFocusedRef.current) {
        scheduleControlsAutoHideEvent();
        return;
      }

      clearControlsHideTimeoutEvent();
    };

    window.addEventListener('keydown', handleControlsActivity);

    return () => {
      window.removeEventListener('keydown', handleControlsActivity);
    };
  }, [isExpanded, isShown]);

  return (
    <LazyMotion features={domAnimation}>
      <MusicPlayerControlsContent
        playerUi={{ arePlayerControlsVisible, isLoading }}
        currentTime={currentTime}
        playerDuration={playerDuration}
        setCurrentTime={setCurrentTime}
        setDuration={setDuration}
        handleTimelineFocusChange={handleTimelineFocusChange}
        togglePlayPause={togglePlayPause}
        getActivePlaybackPosition={getActivePlaybackPosition}
        getActivePlaybackDuration={getActivePlaybackDuration}
        setActivePlaybackPosition={setActivePlaybackPosition}
        queueState={{ isQueueMenuOpen, setIsQueueMenuOpen }}
        karaokeUi={{
          showKaraokeMixer,
          isKaraokeAvailable,
          shouldShowKaraokeButton,
          isKaraokeActive,
          isKaraokeReady,
          isKaraokePreparing,
        }}
        t={t}
        karaokeMix={karaokeMix}
        handleKaraokeMixChange={handleKaraokeMixChange}
        currentSong={currentSong}
        songQueue={songQueue}
        handlePlayPrevious={handlePlayPrevious}
        handlePlayNextSong={handlePlayNextSong}
        toggleKaraokeMixer={toggleKaraokeMixer}
        lyricsUi={{
          isLyricsButtonDisabled,
          showLyrics,
          isLyricsOptionsOpen,
          isLyricsOptionsButtonDisabled,
          hasLyrics,
          hasPronunciation,
          showPronunciation,
          hasTranslation,
          showTranslation,
        }}
        setIsLyricsOptionsOpen={setIsLyricsOptionsOpen}
        setShowLyrics={setShowLyrics}
        setShowPronunciation={setShowPronunciation}
        setShowTranslation={setShowTranslation}
        closeLyricsOptions={closeLyricsOptions}
      />
    </LazyMotion>
  );
}

export default memo(MusicPlayerControls);
