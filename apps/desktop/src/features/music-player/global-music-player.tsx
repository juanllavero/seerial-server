import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetSongLyrics } from '@seerial/api';
import type { LyricsLine } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import type { SetStateAction } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LRCVisualizer from '@/features/music-player/lrc-visualizer';
import GradientBackground from '@/shared/components/backgrounds/music-gradient-background';
import { NavigationContainer } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import Artwork from './artwork';
import { useMusicPlayerMpv } from './hooks/use-music-player-mpv';
import MusicPlayerControls from './music-player-controls';

function useSongLyricsPanel(
  songId: string | undefined,
  isShown: boolean,
  isExpanded: boolean,
  showLyrics: boolean,
  setShowLyrics: (showLyrics: boolean) => void,
) {
  const hasAutoEnabledLyricsRef = useRef(false);
  const previousSongIdRef = useRef<string | undefined>(undefined);
  const previousExpandedRef = useRef(false);
  const { data: lyrics = [], isLoading: isLyricsLoading } = useGetSongLyrics<LyricsLine[]>(
    songId ?? '',
    {
      enabled: Boolean(songId && isShown),
    },
  );

  const hasLyrics = lyrics.length > 0;

  useEffect(() => {
    const songChanged = previousSongIdRef.current !== songId;
    const playerJustOpened = isExpanded && !previousExpandedRef.current;

    previousSongIdRef.current = songId;
    previousExpandedRef.current = isExpanded;

    if (songChanged || playerJustOpened) {
      hasAutoEnabledLyricsRef.current = false;
    }
  }, [isExpanded, songId]);

  useEffect(() => {
    if (!showLyrics || isLyricsLoading || hasLyrics) {
      return;
    }

    setShowLyrics(false);
  }, [hasLyrics, isLyricsLoading, setShowLyrics, showLyrics]);

  useEffect(() => {
    if (
      hasAutoEnabledLyricsRef.current ||
      !isShown ||
      !isExpanded ||
      isLyricsLoading ||
      !hasLyrics ||
      showLyrics
    ) {
      return;
    }

    hasAutoEnabledLyricsRef.current = true;
    setShowLyrics(true);
  }, [hasLyrics, isExpanded, isLyricsLoading, isShown, setShowLyrics, showLyrics]);

  return {
    lyrics,
    isLyricsLoading,
    hasLyrics,
    shouldShowLyricsPanel: showLyrics && (hasLyrics || isLyricsLoading),
    isLyricsButtonDisabled: !hasLyrics && !isLyricsLoading && !showLyrics,
  };
}

function useLyricsDisplayOptions(
  lyrics: LyricsLine[],
  isLyricsLoading: boolean,
  showLyrics: boolean,
  currentSongId: string | undefined,
) {
  const [lyricsDisplayState, setLyricsDisplayState] = useState<{
    showPronunciation: boolean | null;
    showTranslation: boolean | null;
    isLyricsOptionsOpen: boolean;
  }>({
    showPronunciation: null,
    showTranslation: null,
    isLyricsOptionsOpen: false,
  });
  const previousSongIdRef = useRef<string | undefined>(undefined);

  const { showPronunciation, showTranslation, isLyricsOptionsOpen } = lyricsDisplayState;

  const hasPronunciation = useMemo(
    () =>
      lyrics.some(
        (l) => !l.isBlank && (!!l.words?.pronunciation?.length || !!l.plainText?.pronunciation),
      ),
    [lyrics],
  );
  const hasTranslation = useMemo(() => lyrics.some((l) => !!l.translation), [lyrics]);
  const isLyricsOptionsButtonDisabled = !hasPronunciation && !hasTranslation;

  useEffect(() => {
    if (previousSongIdRef.current === currentSongId) {
      return;
    }

    previousSongIdRef.current = currentSongId;
    setLyricsDisplayState({
      showPronunciation: null,
      showTranslation: null,
      isLyricsOptionsOpen: false,
    });
  }, [currentSongId]);

  useEffect(() => {
    if (isLyricsLoading) {
      return;
    }

    if (!hasPronunciation) {
      setLyricsDisplayState((currentState) => ({
        ...currentState,
        showPronunciation: false,
      }));
      return;
    }

    if (showPronunciation === null) {
      setLyricsDisplayState((currentState) => ({
        ...currentState,
        showPronunciation: true,
      }));
    }
  }, [hasPronunciation, isLyricsLoading, showPronunciation]);

  useEffect(() => {
    if (isLyricsLoading || showTranslation !== null) {
      return;
    }

    setLyricsDisplayState((currentState) => ({
      ...currentState,
      showTranslation: hasTranslation,
    }));
  }, [hasTranslation, isLyricsLoading, showTranslation]);

  useEffect(() => {
    if (showLyrics || isLyricsLoading) {
      return;
    }

    setLyricsDisplayState((currentState) => ({
      ...currentState,
      isLyricsOptionsOpen: false,
    }));
  }, [isLyricsLoading, showLyrics]);

  useEffect(() => {
    if (!isLyricsOptionsButtonDisabled) {
      return;
    }

    setLyricsDisplayState((currentState) => ({
      ...currentState,
      isLyricsOptionsOpen: false,
    }));
  }, [isLyricsOptionsButtonDisabled]);

  const closeLyricsOptions = useCallback((restoreFocus = true) => {
    setLyricsDisplayState((currentState) => ({
      ...currentState,
      isLyricsOptionsOpen: false,
    }));

    if (restoreFocus) {
      window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.lyricsOptionsButton);
      }, 30);
    }
  }, []);

  const setShowPronunciation = useCallback((value: SetStateAction<boolean | null>) => {
    setLyricsDisplayState((currentState) => ({
      ...currentState,
      showPronunciation:
        typeof value === 'function'
          ? (value as (prevState: boolean | null) => boolean | null)(currentState.showPronunciation)
          : value,
    }));
  }, []);

  const setShowTranslation = useCallback((value: boolean) => {
    setLyricsDisplayState((currentState) => ({
      ...currentState,
      showTranslation: value,
    }));
  }, []);

  const setIsLyricsOptionsOpen = useCallback((value: SetStateAction<boolean>) => {
    setLyricsDisplayState((currentState) => ({
      ...currentState,
      isLyricsOptionsOpen:
        typeof value === 'function'
          ? (value as (prevState: boolean) => boolean)(currentState.isLyricsOptionsOpen)
          : value,
    }));
  }, []);

  return {
    showPronunciation,
    showTranslation: showTranslation ?? false,
    isLyricsOptionsOpen,
    hasPronunciation,
    hasTranslation,
    isLyricsOptionsButtonDisabled,
    setShowPronunciation,
    setShowTranslation,
    setIsLyricsOptionsOpen,
    closeLyricsOptions,
  };
}

function GlobalMusicPlayer() {
  const { t } = useTranslation();
  const {
    album,
    currentSong,
    songQueue,
    isShown,
    isExpanded,
    isPlaying,
    isLoading,
    showLyrics,
    currentTime,
    duration,
    setShowLyrics,
    setCurrentTime,
    setDuration,
    selectSong,
  } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      songQueue: state.songQueue,
      isShown: state.isShown,
      isExpanded: state.isExpanded,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      showLyrics: state.showLyrics,
      currentTime: state.currentTime,
      duration: state.duration,
      setShowLyrics: state.setShowLyrics,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      selectSong: state.selectSong,
    }),
    shallow,
  );

  const currentSongId = currentSong?.id;
  const previousFocusKeyRef = useRef<string | null>(null);
  const [showKaraokeMixer, setShowKaraokeMixer] = useState(false);
  const [isQueueMenuOpen, setIsQueueMenuOpen] = useState(false);
  const { lyrics, isLyricsLoading, hasLyrics, shouldShowLyricsPanel, isLyricsButtonDisabled } =
    useSongLyricsPanel(currentSongId, isShown, isExpanded, showLyrics, setShowLyrics);
  const {
    showPronunciation,
    showTranslation,
    isLyricsOptionsOpen,
    hasPronunciation,
    hasTranslation,
    isLyricsOptionsButtonDisabled,
    setShowPronunciation,
    setShowTranslation,
    setIsLyricsOptionsOpen,
    closeLyricsOptions,
  } = useLyricsDisplayOptions(lyrics, isLyricsLoading, showLyrics, currentSongId);
  const handleKaraokeUnavailable = useCallback(() => setShowKaraokeMixer(false), []);

  const {
    isKaraokeActive,
    isKaraokeAvailable,
    isKaraokePreparing,
    isKaraokeReady,
    shouldShowKaraokeButton,
    karaokeMix,
    togglePlayPause,
    stopPlayback,
    handleKaraokeMixChange,
    getActivePlaybackPosition,
    getActivePlaybackDuration,
    setActivePlaybackPosition,
  } = useMusicPlayerMpv({ onKaraokeUnavailable: handleKaraokeUnavailable });

  const closeQueueMenu = useCallback((restoreFocus = true) => {
    setIsQueueMenuOpen(false);

    if (restoreFocus) {
      window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.openQueueButton);
      }, 30);
    }
  }, []);

  useKeyboardBack({
    enabled: isShown && isExpanded,
    preAction: () => {
      if (isQueueMenuOpen) {
        closeQueueMenu();
        return;
      }

      if (isLyricsOptionsOpen) {
        closeLyricsOptions();
        return;
      }

      handleStop();
    },
    navigateOnBack: false,
    capture: true,
    stopPropagation: true,
  });

  useEffect(() => {
    if (isShown && isExpanded) {
      previousFocusKeyRef.current = getCurrentFocusKey();
      const focusTimer = window.setTimeout(() => setFocus(NavigationFocusKeys.player.timeline), 30);
      return () => {
        window.clearTimeout(focusTimer);
      };
    }
  }, [isShown, isExpanded]);

  useEffect(() => {
    if (isShown && isExpanded) {
      return;
    }

    setIsQueueMenuOpen(false);
  }, [isExpanded, isShown]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setShowKaraokeMixer(false);

    const keyToRestore = previousFocusKeyRef.current;

    window.setTimeout(() => {
      setFocus(keyToRestore ?? NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [stopPlayback]);

  if (!currentSong || !isShown) {
    return null;
  }

  const playerDuration = duration > 0 ? duration : currentSong.duration;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isExpanded && (
          <m.div
            key="global-music-player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="fixed inset-0 z-120 bg-stone-950"
          >
            <GradientBackground imageUrl={album?.coverSrc ?? ''} />

            <NavigationContainer
              customFocusKey="music-player-overlay"
              className="relative h-full w-full overflow-hidden"
            >
              <div className="flex h-full w-full justify-center">
                <FlexBox direction="column" gap={6} width="100%" justify="end" align="center">
                  <FlexBox
                    gap={3}
                    width="100%"
                    height="100vh"
                    align="center"
                    justify="center"
                    className="relative overflow-hidden"
                  >
                    <Artwork
                      imageSrc={album?.coverSrc}
                      albumFolderPath={album?.folder}
                      shouldShowLyricsPanel={shouldShowLyricsPanel}
                    />

                    <AnimatePresence initial={false}>
                      {shouldShowLyricsPanel && (
                        <m.div
                          key="lyrics-panel"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeInOut' }}
                          className="absolute top-0 right-0 z-0 h-screen w-[63dvw] overflow-hidden"
                        >
                          <div className="h-full w-full overflow-hidden">
                            <LRCVisualizer
                              lyrics={lyrics}
                              isLoading={isLyricsLoading}
                              showPronunciation={Boolean(showPronunciation)}
                              showTranslation={Boolean(showTranslation)}
                            />
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </FlexBox>
                </FlexBox>

                <MusicPlayerControls
                  t={t}
                  currentSong={currentSong}
                  playerState={{
                    isExpanded,
                    isShown,
                    isPlaying,
                    isLoading,
                  }}
                  currentTime={currentTime}
                  playerDuration={playerDuration}
                  setCurrentTime={setCurrentTime}
                  setDuration={setDuration}
                  togglePlayPause={togglePlayPause}
                  getActivePlaybackPosition={getActivePlaybackPosition}
                  getActivePlaybackDuration={getActivePlaybackDuration}
                  setActivePlaybackPosition={setActivePlaybackPosition}
                  lyricsState={{
                    showLyrics,
                    isLyricsButtonDisabled,
                    isLyricsOptionsOpen,
                    isLyricsOptionsButtonDisabled,
                    hasLyrics,
                    hasPronunciation,
                    showPronunciation: Boolean(showPronunciation),
                    hasTranslation,
                    showTranslation,
                  }}
                  setShowLyrics={setShowLyrics}
                  setIsLyricsOptionsOpen={setIsLyricsOptionsOpen}
                  setShowPronunciation={setShowPronunciation}
                  setShowTranslation={setShowTranslation}
                  closeLyricsOptions={closeLyricsOptions}
                  karaokeState={{
                    shouldShowKaraokeButton,
                    isKaraokePreparing,
                    isKaraokeActive,
                    isKaraokeReady,
                    isKaraokeAvailable,
                    showKaraokeMixer,
                  }}
                  karaokeMix={karaokeMix}
                  setShowKaraokeMixer={setShowKaraokeMixer}
                  handleKaraokeMixChange={handleKaraokeMixChange}
                  isQueueMenuOpen={isQueueMenuOpen}
                  setIsQueueMenuOpen={setIsQueueMenuOpen}
                  songQueue={songQueue}
                  selectSong={selectSong}
                />
              </div>
            </NavigationContainer>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

export default memo(GlobalMusicPlayer);
