import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { getSignedSongStreamUrl, useGetSongLyrics } from '@seerial/api';
import { useMusicStore, useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { MicVocal, Pause, Play, SkipBack, SkipForward, SquareIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';
import LRCVisualizer, { type SongLyricsFile } from '@/features/music-player/lrc-visualizer';
import TimelineSlider from '@/pages/videoplayer/components/controls/timeline-slider';
import Loading from '@/shared/components/loading';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

const READY_POLL_INTERVAL_MS = 250;
const LOAD_TIMEOUT_MS = 5000;

interface PlaybackStatus {
  position?: number;
  duration?: number;
  eofReached: boolean;
}

function getArtistsText(artists?: string[]): string {
  if (!artists || artists.length === 0) {
    return '';
  }

  return artists.join(' • ');
}

async function waitForAudioReady(timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const duration = await invoke<number>('get_duration');
      if (Number.isFinite(duration) && duration > 0) {
        return true;
      }
    } catch {
      // Keep polling until timeout to allow MPV metadata parsing.
    }

    await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
  }

  return false;
}

function useSongLyricsPanel(
  songId: string | undefined,
  isShown: boolean,
  showLyrics: boolean,
  setShowLyrics: (showLyrics: boolean) => void,
) {
  const { data: lyrics = [], isLoading: isLyricsLoading } = useGetSongLyrics<SongLyricsFile[]>(
    songId ?? '',
    {
      enabled: Boolean(songId && isShown),
    },
  );

  const hasLyrics = lyrics.length > 0;

  useEffect(() => {
    if (!showLyrics || isLyricsLoading || hasLyrics) {
      return;
    }

    setShowLyrics(false);
  }, [hasLyrics, isLyricsLoading, setShowLyrics, showLyrics]);

  return {
    lyrics,
    isLyricsLoading,
    hasLyrics,
    shouldShowLyricsPanel: showLyrics && (hasLyrics || isLyricsLoading),
    isLyricsButtonDisabled: !hasLyrics && !isLyricsLoading && !showLyrics,
  };
}

function GlobalMusicPlayer() {
  const { t } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
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
    setIsPlaying,
    setIsLoading,
    setShowLyrics,
    setCurrentTime,
    setDuration,
    setProgress,
    resetPlayerState,
    handlePrevious,
    handleNext,
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
      setIsPlaying: state.setIsPlaying,
      setIsLoading: state.setIsLoading,
      setShowLyrics: state.setShowLyrics,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      setProgress: state.setProgress,
      resetPlayerState: state.resetPlayerState,
      handlePrevious: state.handlePrevious,
      handleNext: state.handleNext,
    }),
    shallow,
  );

  const loadAttemptRef = useRef(0);
  const eofGuardRef = useRef(false);
  const { lyrics, isLyricsLoading, shouldShowLyricsPanel, isLyricsButtonDisabled } =
    useSongLyricsPanel(currentSong?.id, isShown, showLyrics, setShowLyrics);

  const updatePlaybackProgress = useCallback(
    (statusPosition: number) => {
      setCurrentTime(statusPosition);
      const safeDuration = duration > 0 ? duration : (currentSong?.duration ?? 0);

      if (safeDuration > 0) {
        setProgress((statusPosition / safeDuration) * 100);
      }
    },
    [currentSong?.duration, duration, setCurrentTime, setProgress],
  );

  const processPlaybackStatus = useCallback(
    (status: PlaybackStatus) => {
      if (typeof status.position === 'number' && Number.isFinite(status.position)) {
        updatePlaybackProgress(status.position);
      }

      if (typeof status.duration === 'number' && Number.isFinite(status.duration)) {
        setDuration(status.duration);
      }

      if (!status.eofReached || eofGuardRef.current) {
        return;
      }

      eofGuardRef.current = true;
      handleNext();
      window.setTimeout(() => {
        eofGuardRef.current = false;
      }, 200);
    },
    [handleNext, setDuration, updatePlaybackProgress],
  );

  const loadCurrentSong = useCallback(async () => {
    if (!currentSong || !serverUrl || !isShown) {
      return;
    }

    const currentAttempt = ++loadAttemptRef.current;
    setIsLoading(true);

    try {
      const signedUrl = await getSignedSongStreamUrl({
        filePath: currentSong.fileSrc,
        expiresIn: '10m',
        isDesktop: true,
      });

      if (!signedUrl || currentAttempt !== loadAttemptRef.current) {
        return;
      }

      await invoke('load_url', { url: `${serverUrl}${signedUrl}` });

      const ready = await waitForAudioReady(LOAD_TIMEOUT_MS);
      if (!ready || currentAttempt !== loadAttemptRef.current) {
        return;
      }

      await invoke('play');
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
      setIsPlaying(false);
    } finally {
      if (currentAttempt === loadAttemptRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentSong, isShown, serverUrl, setIsLoading, setIsPlaying]);

  const artistsText = useMemo(() => {
    return getArtistsText(currentSong?.artists);
  }, [currentSong?.artists]);

  const hideExpandedPlayer = useCallback(() => {
    setIsExpanded(false);

    window.setTimeout(() => {
      const { isShown: stillShown, currentSong: stillCurrentSong } = useMusicStore.getState();

      if (stillShown && stillCurrentSong) {
        setFocus(NavigationFocusKeys.topBar.musicPlayer);
        return;
      }

      setFocus(NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [setIsExpanded]);

  useKeyboardBack({
    enabled: isShown && isExpanded,
    preAction: hideExpandedPlayer,
    navigateOnBack: false,
  });

  useEffect(() => {
    invoke('embed_mpv').catch(console.error);
  }, []);

  useEffect(() => {
    void loadCurrentSong();
  }, [loadCurrentSong]);

  useEffect(() => {
    if (!currentSong || !isShown) {
      return;
    }

    const interval = window.setInterval(() => {
      void invoke<PlaybackStatus>('get_playback_status')
        .then(processPlaybackStatus)
        .catch((error) => {
          console.error('Music playback health check failed:', error);
        });
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentSong, isShown, processPlaybackStatus]);

  useEffect(() => {
    if (isShown && isExpanded) {
      setTimeout(() => setFocus(NavigationFocusKeys.player.timeline), 30);
    }
  }, [isShown, isExpanded]);

  const togglePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        await invoke('pause');
        setIsPlaying(false);
      } else {
        await invoke('play');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [isPlaying, setIsPlaying]);

  const handleStop = useCallback(() => {
    invoke('stop').catch(console.error);
    resetPlayerState();

    window.setTimeout(() => {
      setFocus(NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [resetPlayerState]);

  if (!currentSong || !isShown) {
    return null;
  }

  const playerDuration = duration > 0 ? duration : currentSong.duration;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          key="global-music-player"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-120 bg-black"
        >
          <GradientBackground imageSrc={album?.coverSrc ?? ''} />
          <NavigationContainer customFocusKey="music-player-overlay" className="h-full w-full">
            <FlexBox direction="column" justify="center" align="center" width="100%" height="100%">
              <FlexBox
                direction="column"
                gap={6}
                width="95%"
                className="max-w-[160dvh]"
                align="center"
              >
                <FlexBox
                  gap={3}
                  width="100%"
                  align="stretch"
                  justify="center"
                  className="min-h-[45vh]"
                >
                  <div
                    className="flex shrink-0 justify-center transition-[width] duration-300 ease-in-out"
                    style={{ width: shouldShowLyricsPanel ? '45vh' : '100%' }}
                  >
                    <FlexBox direction="column" width={'45vh'} gap={2} align="center">
                      <Image
                        url={album?.coverSrc ?? ''}
                        className="rounded-3xl"
                        width="45vh"
                        height="45vh"
                      />
                      <FlexBox direction="column" gap={0.4} align="center">
                        <h2 className="text-[2.6vh] font-semibold line-clamp-1">
                          {currentSong.title}
                        </h2>
                        <span
                          className="text-[1.8dvh] line-clamp-1 font-semibold"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {artistsText} - {album?.title}
                        </span>
                      </FlexBox>
                    </FlexBox>
                  </div>

                  <AnimatePresence initial={false}>
                    {shouldShowLyricsPanel && (
                      <motion.div
                        key="lyrics-panel"
                        initial={{ x: 64, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 64, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="min-w-0 flex-1"
                      >
                        <LRCVisualizer lyrics={lyrics} isLoading={isLyricsLoading} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FlexBox>

                {!!isLoading && (
                  <div className="h-[7dvh]">
                    <Loading />
                  </div>
                )}

                <FlexBox direction="column" gap={1} align="center" width="100%">
                  <TimelineSlider
                    position={currentTime}
                    setPosition={setCurrentTime}
                    duration={playerDuration}
                    setDuration={setDuration}
                    togglePlayPause={togglePlayPause}
                  />

                  <FlexBox gap={1} justify="center" align="center" className="pt-4">
                    <NavigationButton
                      customKey={NavigationFocusKeys.player.rewindButton}
                      icon={<SkipBack size={'2dvh'} />}
                      hideText
                      variant="ghost"
                      onClick={handlePrevious}
                    />
                    <NavigationButton
                      customKey={NavigationFocusKeys.player.optionsButton}
                      icon={<SquareIcon size={'2vh'} />}
                      hideText
                      variant="ghost"
                      onClick={handleStop}
                    />
                    <NavigationButton
                      customKey={NavigationFocusKeys.player.lyricsButton}
                      title={t('lyrics')}
                      icon={<MicVocal size={'2dvh'} />}
                      hideText
                      variant="ghost"
                      selected={showLyrics}
                      disabled={isLyricsButtonDisabled}
                      onClick={() => setShowLyrics(!showLyrics)}
                    />
                    <NavigationButton
                      customKey={NavigationFocusKeys.player.playPauseButton}
                      icon={isPlaying ? <Pause size={'2dvh'} /> : <Play size={'2dvh'} />}
                      hideText
                      variant="ghost"
                      onClick={() => void togglePlayPause()}
                    />
                    <NavigationButton
                      customKey={NavigationFocusKeys.player.forwardButton}
                      icon={<SkipForward size={'2dvh'} />}
                      hideText
                      variant="ghost"
                      onClick={handleNext}
                    />
                  </FlexBox>
                </FlexBox>
              </FlexBox>
            </FlexBox>
          </NavigationContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalMusicPlayer);
