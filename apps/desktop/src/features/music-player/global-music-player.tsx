import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetSongLyrics } from '@seerial/api';
import type { LyricsLine } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LRCVisualizer from '@/features/music-player/lrc-visualizer';
import GradientBackground from '@/shared/components/backgrounds/music-gradient-background';
import { NavigationContainer } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import AnimatedSoundBars from './animated-sound-bars';
import Artwork from './artwork';
import { useMusicPlayerMpv } from './hooks/use-music-player-mpv';
import MusicPlayerControls from './music-player-controls';

function getArtistsText(artists?: string[]): string {
  if (!artists || artists.length === 0) {
    return '';
  }

  return artists.join(' • ');
}

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
  const [showPronunciation, setShowPronunciation] = useState<boolean | null>(null);
  const [showTranslation, setShowTranslation] = useState<boolean | null>(null);
  const [isLyricsOptionsOpen, setIsLyricsOptionsOpen] = useState(false);
  const previousSongIdRef = useRef<string | undefined>(undefined);

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
    setShowPronunciation(null);
    setShowTranslation(null);
    setIsLyricsOptionsOpen(false);
  }, [currentSongId]);

  useEffect(() => {
    if (isLyricsLoading) {
      return;
    }

    if (!hasPronunciation) {
      setShowPronunciation(false);
      return;
    }

    if (showPronunciation === null) {
      setShowPronunciation(true);
    }
  }, [hasPronunciation, isLyricsLoading, showPronunciation]);

  useEffect(() => {
    if (isLyricsLoading || showTranslation !== null) {
      return;
    }

    setShowTranslation(hasTranslation);
  }, [hasTranslation, isLyricsLoading, showTranslation]);

  useEffect(() => {
    if (showLyrics || isLyricsLoading) {
      return;
    }

    setIsLyricsOptionsOpen(false);
  }, [isLyricsLoading, showLyrics]);

  useEffect(() => {
    if (!isLyricsOptionsButtonDisabled) {
      return;
    }

    setIsLyricsOptionsOpen(false);
  }, [isLyricsOptionsButtonDisabled]);

  const closeLyricsOptions = useCallback((restoreFocus = true) => {
    setIsLyricsOptionsOpen(false);

    if (restoreFocus) {
      window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.lyricsOptionsButton);
      }, 30);
    }
  }, []);

  return {
    showPronunciation,
    showTranslation: showTranslation ?? false,
    isLyricsOptionsOpen,
    hasPronunciation,
    hasTranslation,
    isLyricsOptionsButtonDisabled,
    setShowPronunciation,
    setShowTranslation: (value: boolean) => setShowTranslation(value),
    setIsLyricsOptionsOpen,
    closeLyricsOptions,
  };
}

function GlobalMusicPlayer() {
  const { t } = useTranslation();
  const {
    album,
    currentSong,
    isShown,
    isExpanded,
    isPlaying,
    isLoading,
    showLyrics,
    currentTime,
    duration,
    setIsExpanded,
    setShowLyrics,
    setCurrentTime,
    setDuration,
  } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isShown: state.isShown,
      isExpanded: state.isExpanded,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      showLyrics: state.showLyrics,
      currentTime: state.currentTime,
      duration: state.duration,
      setIsExpanded: state.setIsExpanded,
      setShowLyrics: state.setShowLyrics,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
    }),
    shallow,
  );

  const currentSongId = currentSong?.id;
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

  const artistsText = useMemo(() => {
    return getArtistsText(currentSong?.artists);
  }, [currentSong?.artists]);

  const hideExpandedPlayer = useCallback(() => {
    setIsExpanded(false);
    setIsQueueMenuOpen(false);
    setShowKaraokeMixer(false);
    closeLyricsOptions(false);

    window.setTimeout(() => {
      const { isShown: stillShown, currentSong: stillCurrentSong } = useMusicStore.getState();

      if (stillShown && stillCurrentSong) {
        setFocus(NavigationFocusKeys.topBar.musicPlayer);
        return;
      }

      setFocus(NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [closeLyricsOptions, setIsExpanded]);

  const closeQueueMenu = useCallback((restoreFocus = true) => {
    setIsQueueMenuOpen(false);

    if (restoreFocus) {
      window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.openQueueButton);
      }, 30);
    }
  }, []);

  const renderSongInfo = useCallback(() => {
    if (!currentSong) {
      return null;
    }

    return (
      <FlexBox direction="column" align="center" className="max-w-[30dvw]">
        <div className="relative inline-flex items-center justify-center">
          <AnimatedSoundBars isPlaying={isPlaying} />

          <h2
            className="text-[2.6vh] font-semibold line-clamp-1"
            style={{ textShadow: '0 1px 2px black' }}
          >
            {currentSong.title}
          </h2>
        </div>
        <span
          className="text-[1.8dvh] line-clamp-1 font-semibold text-center"
          style={{
            color: 'var(--color-muted-foreground)',
            textShadow: '0 1px 2px black',
          }}
        >
          {artistsText} - {album?.title}
        </span>
      </FlexBox>
    );
  }, [currentSong, artistsText, album, isPlaying]);

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

      hideExpandedPlayer();
    },
    navigateOnBack: false,
    capture: true,
    stopPropagation: true,
  });

  useEffect(() => {
    if (isShown && isExpanded) {
      setTimeout(() => setFocus(NavigationFocusKeys.player.timeline), 30);
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

    window.setTimeout(() => {
      setFocus(NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [stopPlayback]);

  if (!currentSong || !isShown) {
    return null;
  }

  const playerDuration = duration > 0 ? duration : currentSong.duration;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          key="global-music-player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="fixed inset-0 z-120 bg-black"
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
                    renderSongInfo={renderSongInfo}
                  />

                  <AnimatePresence initial={false}>
                    {shouldShowLyricsPanel && (
                      <motion.div
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FlexBox>
              </FlexBox>

              <MusicPlayerControls
                t={t}
                renderSongInfo={renderSongInfo}
                isExpanded={isExpanded}
                isShown={isShown}
                isPlaying={isPlaying}
                isLoading={isLoading}
                currentTime={currentTime}
                playerDuration={playerDuration}
                setCurrentTime={setCurrentTime}
                setDuration={setDuration}
                togglePlayPause={togglePlayPause}
                getActivePlaybackPosition={getActivePlaybackPosition}
                getActivePlaybackDuration={getActivePlaybackDuration}
                setActivePlaybackPosition={setActivePlaybackPosition}
                handleStop={handleStop}
                showLyrics={showLyrics}
                isLyricsButtonDisabled={isLyricsButtonDisabled}
                setShowLyrics={setShowLyrics}
                isLyricsOptionsOpen={isLyricsOptionsOpen}
                setIsLyricsOptionsOpen={setIsLyricsOptionsOpen}
                isLyricsOptionsButtonDisabled={isLyricsOptionsButtonDisabled}
                hasLyrics={hasLyrics}
                hasPronunciation={hasPronunciation}
                showPronunciation={Boolean(showPronunciation)}
                hasTranslation={hasTranslation}
                showTranslation={showTranslation}
                setShowPronunciation={setShowPronunciation}
                setShowTranslation={setShowTranslation}
                closeLyricsOptions={closeLyricsOptions}
                shouldShowKaraokeButton={shouldShowKaraokeButton}
                isKaraokePreparing={isKaraokePreparing}
                isKaraokeActive={isKaraokeActive}
                isKaraokeReady={isKaraokeReady}
                isKaraokeAvailable={isKaraokeAvailable}
                karaokeMix={karaokeMix}
                showKaraokeMixer={showKaraokeMixer}
                setShowKaraokeMixer={setShowKaraokeMixer}
                handleKaraokeMixChange={handleKaraokeMixChange}
                isQueueMenuOpen={isQueueMenuOpen}
                setIsQueueMenuOpen={setIsQueueMenuOpen}
              />
            </div>
          </NavigationContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalMusicPlayer);
