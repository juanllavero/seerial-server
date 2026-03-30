import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { getSignedSongStreamUrl } from '@seerial/api';
import { useMusicStore, useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';
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

function GlobalMusicPlayer() {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const {
    album,
    currentSong,
    isShown,
    isExpanded,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    setIsExpanded,
    setIsPlaying,
    setIsLoading,
    setCurrentTime,
    setDuration,
    setProgress,
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
      currentTime: state.currentTime,
      duration: state.duration,
      setIsExpanded: state.setIsExpanded,
      setIsPlaying: state.setIsPlaying,
      setIsLoading: state.setIsLoading,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      setProgress: state.setProgress,
      handlePrevious: state.handlePrevious,
      handleNext: state.handleNext,
    }),
    shallow,
  );

  const loadAttemptRef = useRef(0);
  const eofGuardRef = useRef(false);

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
    if (!currentSong?.artists || currentSong.artists.length === 0) {
      return '';
    }

    return currentSong.artists.join(' • ');
  }, [currentSong?.artists]);

  useKeyboardBack({
    enabled: isShown && isExpanded,
    preAction: () => setIsExpanded(false),
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
          className="fixed inset-0 z-120 bg-black/95"
        >
          <NavigationContainer customFocusKey="music-player-overlay" className="h-full w-full">
            <FlexBox direction="column" justify="center" align="center" width="100%" height="100%">
              <FlexBox direction="column" gap={2} width="65%" className="max-w-[120dvh]">
                <FlexBox gap={2} align="center">
                  <Image
                    url={album?.coverSrc ?? ''}
                    className="rounded-xl"
                    width="16dvh"
                    height="16dvh"
                  />
                  <FlexBox direction="column" gap={0.4}>
                    <h2 className="text-[4dvh] font-semibold line-clamp-1">{currentSong.title}</h2>
                    <span className="text-white/70 text-[2.1dvh] line-clamp-1">{artistsText}</span>
                    <span className="text-white/50 text-[1.8dvh] line-clamp-1">{album?.title}</span>
                  </FlexBox>
                </FlexBox>

                {!!isLoading && (
                  <div className="h-[7dvh]">
                    <Loading />
                  </div>
                )}

                <TimelineSlider
                  position={currentTime}
                  setPosition={setCurrentTime}
                  duration={playerDuration}
                  setDuration={setDuration}
                  isFocused
                />

                <FlexBox gap={1} justify="center" align="center" className="pt-4">
                  <NavigationButton
                    customKey={NavigationFocusKeys.player.rewindButton}
                    icon={<SkipBack size={'3dvh'} />}
                    hideText
                    onClick={handlePrevious}
                  />
                  <NavigationButton
                    customKey={NavigationFocusKeys.player.playPauseButton}
                    icon={isPlaying ? <Pause size={'3.2dvh'} /> : <Play size={'3.2dvh'} />}
                    hideText
                    onClick={() => void togglePlayPause()}
                  />
                  <NavigationButton
                    customKey={NavigationFocusKeys.player.forwardButton}
                    icon={<SkipForward size={'3dvh'} />}
                    hideText
                    onClick={handleNext}
                  />
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
