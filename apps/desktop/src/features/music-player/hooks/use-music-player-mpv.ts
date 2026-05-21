import { getSignedSongStreamUrl } from '@seerial/api';
import { useMusicStore, useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';

const READY_POLL_INTERVAL_MS = 250;
const LOAD_TIMEOUT_MS = 5000;
const KARAOKE_MIX_MIN = -10;
const KARAOKE_MIX_MAX = 10;

type PlaybackBackend = 'mpv' | 'karaoke';

interface PlaybackStatus {
  position?: number;
  duration?: number;
  eofReached: boolean;
}

interface KaraokeStatus extends PlaybackStatus {
  paused?: boolean;
}

interface KaraokePreloadStatus {
  matchesRequest: boolean;
  isLoading: boolean;
  isReady: boolean;
  error?: string | null;
}

interface KaraokeStemUrls {
  instrumental: string;
  vocals: string;
}

interface UseMusicPlayerMpvOptions {
  onKaraokeUnavailable?: () => void;
}

export interface UseMusicPlayerMpvResult {
  isKaraokeActive: boolean;
  isKaraokeAvailable: boolean;
  isKaraokePreparing: boolean;
  isKaraokeReady: boolean;
  shouldShowKaraokeButton: boolean;
  karaokeMix: number;
  togglePlayPause: () => Promise<void>;
  stopPlayback: () => void;
  handleKaraokeMixChange: (value: number) => Promise<void>;
  getActivePlaybackPosition: () => Promise<number>;
  getActivePlaybackDuration: () => Promise<number>;
  setActivePlaybackPosition: (position: number) => Promise<void>;
}

function replaceSongExtension(filePath: string, suffix: string): string {
  const lastDotIndex = filePath.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return `${filePath}${suffix}`;
  }

  return `${filePath.slice(0, lastDotIndex)}${suffix}`;
}

function clampKaraokeMix(value: number): number {
  return Math.min(Math.max(value, KARAOKE_MIX_MIN), KARAOKE_MIX_MAX);
}

function getKaraokeMixVolumes(mixValue: number): { instrumental: number; vocals: number } {
  const clampedValue = clampKaraokeMix(mixValue);

  if (clampedValue < 0) {
    return { instrumental: 1, vocals: (10 + clampedValue) / 10 };
  }

  if (clampedValue > 0) {
    return { instrumental: (10 - clampedValue) / 10, vocals: 1 };
  }

  return { instrumental: 1, vocals: 1 };
}

async function waitForAudioReady(timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();

  const pollUntilReady = async (): Promise<boolean> => {
    if (Date.now() - startedAt >= timeoutMs) {
      return false;
    }

    try {
      const duration = await invoke<number>('get_duration');
      if (Number.isFinite(duration) && duration > 0) {
        return true;
      }
    } catch {
      // Keep polling until timeout to allow MPV metadata parsing.
    }

    await new Promise<void>((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
    return pollUntilReady();
  };

  return pollUntilReady();
}

function useKaraokeAvailability(
  songFileSrc: string | undefined,
  serverUrl: string,
  isShown: boolean,
  onUnavailable?: () => void,
) {
  const karaokeAvailabilityAttemptRef = useRef(0);
  const karaokePreloadAttemptRef = useRef(0);
  const [karaokeStemUrls, setKaraokeStemUrls] = useState<KaraokeStemUrls | null>(null);
  const [isKaraokePreparing, setIsKaraokePreparing] = useState(false);
  const [isKaraokeReady, setIsKaraokeReady] = useState(false);

  const markUnavailable = useCallback(
    (error?: unknown) => {
      if (error) {
        console.error('Failed to preload karaoke stems:', error);
      }

      setIsKaraokePreparing(false);
      setIsKaraokeReady(false);
      setKaraokeStemUrls(null);
      void invoke('reset_karaoke_preload').catch(() => undefined);
      onUnavailable?.();
    },
    [onUnavailable],
  );

  const resolveKaraokeStems = useCallback(() => {
    if (!songFileSrc || !serverUrl || !isShown) {
      setKaraokeStemUrls(null);
      setIsKaraokePreparing(false);
      setIsKaraokeReady(false);
      return;
    }

    const currentAttempt = ++karaokeAvailabilityAttemptRef.current;
    const instrumentalPath = replaceSongExtension(songFileSrc, '.inst.flac');
    const vocalsPath = replaceSongExtension(songFileSrc, '.vocals.flac');

    void Promise.allSettled([
      getSignedSongStreamUrl({ filePath: instrumentalPath, expiresIn: '10m', isDesktop: true }),
      getSignedSongStreamUrl({ filePath: vocalsPath, expiresIn: '10m', isDesktop: true }),
    ])
      .then(([instrumentalResult, vocalsResult]) => {
        if (currentAttempt !== karaokeAvailabilityAttemptRef.current) {
          return;
        }

        if (
          instrumentalResult.status !== 'fulfilled' ||
          vocalsResult.status !== 'fulfilled' ||
          !instrumentalResult.value ||
          !vocalsResult.value
        ) {
          setKaraokeStemUrls(null);
          setIsKaraokePreparing(false);
          setIsKaraokeReady(false);
          onUnavailable?.();
          return;
        }

        setKaraokeStemUrls({
          instrumental: `${serverUrl}${instrumentalResult.value}`,
          vocals: `${serverUrl}${vocalsResult.value}`,
        });
        setIsKaraokePreparing(true);
        setIsKaraokeReady(false);
      })
      .catch(() => {
        if (currentAttempt !== karaokeAvailabilityAttemptRef.current) {
          return;
        }

        setKaraokeStemUrls(null);
        setIsKaraokePreparing(false);
        setIsKaraokeReady(false);
        onUnavailable?.();
      });
  }, [isShown, onUnavailable, serverUrl, songFileSrc]);

  const handlePolledPreloadStatus = useCallback(
    (status: KaraokePreloadStatus): boolean => {
      if (!status.matchesRequest || status.isLoading) {
        return false;
      }

      if (status.isReady) {
        setIsKaraokePreparing(false);
        setIsKaraokeReady(true);
        return true;
      }

      markUnavailable(status.error ?? 'Unknown error');
      return true;
    },
    [markUnavailable],
  );

  const clearPollingInterval = useCallback((pollIntervalId: number | null) => {
    if (pollIntervalId !== null) {
      window.clearInterval(pollIntervalId);
    }
  }, []);

  const isStalePreloadAttempt = useCallback(
    (attempt: number) => attempt !== karaokePreloadAttemptRef.current,
    [],
  );

  const pollKaraokePreloadStatus = useCallback(
    (attempt: number, pollIntervalId: number | null, stemUrls: KaraokeStemUrls) => {
      void invoke<KaraokePreloadStatus>('get_karaoke_preload_status_for_urls', {
        instUrl: stemUrls.instrumental,
        voiceUrl: stemUrls.vocals,
      })
        .then((status) => {
          if (isStalePreloadAttempt(attempt)) {
            clearPollingInterval(pollIntervalId);
            return;
          }

          if (handlePolledPreloadStatus(status)) {
            clearPollingInterval(pollIntervalId);
          }
        })
        .catch((error) => {
          if (isStalePreloadAttempt(attempt)) {
            clearPollingInterval(pollIntervalId);
            return;
          }

          clearPollingInterval(pollIntervalId);
          markUnavailable(error);
        });
    },
    [clearPollingInterval, handlePolledPreloadStatus, isStalePreloadAttempt, markUnavailable],
  );

  useEffect(() => {
    void resolveKaraokeStems();
  }, [resolveKaraokeStems]);

  useEffect(() => {
    if (!karaokeStemUrls) {
      return;
    }

    const currentAttempt = ++karaokePreloadAttemptRef.current;
    let pollIntervalId: number | null = null;
    setIsKaraokePreparing(true);
    setIsKaraokeReady(false);

    void invoke('preload_karaoke', {
      instUrl: karaokeStemUrls.instrumental,
      voiceUrl: karaokeStemUrls.vocals,
    })
      .then(() => {
        pollIntervalId = window.setInterval(() => {
          pollKaraokePreloadStatus(currentAttempt, pollIntervalId, karaokeStemUrls);
        }, 250);
      })
      .catch((error) => {
        if (isStalePreloadAttempt(currentAttempt)) {
          return;
        }

        markUnavailable(error);
      });

    return () => {
      clearPollingInterval(pollIntervalId);
    };
  }, [
    clearPollingInterval,
    isStalePreloadAttempt,
    karaokeStemUrls,
    markUnavailable,
    pollKaraokePreloadStatus,
  ]);

  const resetKaraokeAvailability = useCallback(() => {
    setKaraokeStemUrls(null);
    setIsKaraokePreparing(false);
    setIsKaraokeReady(false);
    void invoke('reset_karaoke_preload').catch(() => undefined);
  }, []);

  return {
    karaokeStemUrls,
    isKaraokePreparing,
    isKaraokeReady,
    shouldShowKaraokeButton: isKaraokePreparing || isKaraokeReady,
    resetKaraokeAvailability,
  };
}

/**
 * Encapsulates all MPV and karaoke native player calls for the music player.
 * Components should use this hook instead of calling invoke() directly.
 */
export function useMusicPlayerMpv({
  onKaraokeUnavailable,
}: UseMusicPlayerMpvOptions = {}): UseMusicPlayerMpvResult {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const {
    currentSong,
    isPlaying,
    duration,
    isShown,
    playbackVersion,
    setIsPlaying,
    setIsLoading,
    setCurrentTime,
    setDuration,
    setProgress,
    resetPlayerState,
    handleNext,
  } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      duration: state.duration,
      isShown: state.isShown,
      playbackVersion: state.playbackVersion,
      setIsPlaying: state.setIsPlaying,
      setIsLoading: state.setIsLoading,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      setProgress: state.setProgress,
      resetPlayerState: state.resetPlayerState,
      handleNext: state.handleNext,
    }),
    shallow,
  );

  const loadAttemptRef = useRef(0);
  const eofGuardRef = useRef(false);
  const [playbackBackend, setPlaybackBackend] = useState<PlaybackBackend>('mpv');
  const [karaokeMix, setKaraokeMix] = useState(0);

  const {
    karaokeStemUrls,
    isKaraokePreparing,
    isKaraokeReady,
    shouldShowKaraokeButton,
    resetKaraokeAvailability,
  } = useKaraokeAvailability(currentSong?.fileSrc, serverUrl, isShown, onKaraokeUnavailable);

  const getActivePlaybackStatus = useCallback(async (): Promise<PlaybackStatus> => {
    if (playbackBackend === 'karaoke') {
      const status = await invoke<KaraokeStatus>('get_karaoke_status');
      return {
        position: status.position,
        duration: status.duration,
        eofReached: status.eofReached,
      };
    }

    return invoke<PlaybackStatus>('get_playback_status');
  }, [playbackBackend]);

  const getActivePlaybackPosition = useCallback(async (): Promise<number> => {
    if (playbackBackend === 'karaoke') {
      const status = await invoke<KaraokeStatus>('get_karaoke_status');
      return status.position ?? 0;
    }

    return invoke<number>('get_position');
  }, [playbackBackend]);

  const getActivePlaybackDuration = useCallback(async (): Promise<number> => {
    if (playbackBackend === 'karaoke') {
      const status = await invoke<KaraokeStatus>('get_karaoke_status');
      return status.duration ?? duration ?? 0;
    }

    return invoke<number>('get_duration');
  }, [duration, playbackBackend]);

  const setActivePlaybackPosition = useCallback(
    async (position: number): Promise<void> => {
      if (playbackBackend === 'karaoke') {
        await invoke('seek_karaoke', { position });
        return;
      }

      await invoke('set_position', { position });
    },
    [playbackBackend],
  );

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
    if (!currentSong || !serverUrl || !isShown || playbackBackend !== 'mpv') {
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
  }, [currentSong, isShown, playbackBackend, serverUrl, setIsLoading, setIsPlaying]);

  const activateKaraokePlayback = useCallback(
    async (nextMix: number) => {
      if (!karaokeStemUrls) {
        return;
      }

      const nextPosition = await getActivePlaybackPosition();
      const shouldStartPaused = !isPlaying;
      const { instrumental, vocals } = getKaraokeMixVolumes(nextMix);

      setIsLoading(true);

      try {
        if (playbackBackend !== 'karaoke') {
          await invoke('stop');
          await invoke('start_karaoke', {
            instUrl: karaokeStemUrls.instrumental,
            voiceUrl: karaokeStemUrls.vocals,
            position: nextPosition,
            paused: shouldStartPaused,
          });
          setPlaybackBackend('karaoke');
        }

        await invoke('set_karaoke_mix', { instVol: instrumental, voiceVol: vocals });
      } catch (error) {
        console.error(error);
        setPlaybackBackend('mpv');
        setIsPlaying(false);
        setKaraokeMix(0);
        await invoke('stop_karaoke').catch(() => undefined);
      } finally {
        setIsLoading(false);
      }
    },
    [
      getActivePlaybackPosition,
      isPlaying,
      karaokeStemUrls,
      playbackBackend,
      setIsLoading,
      setIsPlaying,
    ],
  );

  const handleKaraokeMixChange = useCallback(
    async (value: number) => {
      const nextMix = clampKaraokeMix(value);
      setKaraokeMix(nextMix);

      if (nextMix === 0 && playbackBackend !== 'karaoke') {
        return;
      }

      await activateKaraokePlayback(nextMix);
    },
    [activateKaraokePlayback, playbackBackend],
  );

  const togglePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        if (playbackBackend === 'karaoke') {
          await invoke('pause_karaoke');
        } else {
          await invoke('pause');
        }
        setIsPlaying(false);
      } else {
        if (playbackBackend === 'karaoke') {
          await invoke('resume_karaoke');
        } else {
          await invoke('play');
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [isPlaying, playbackBackend, setIsPlaying]);

  const stopPlayback = useCallback(() => {
    invoke('stop').catch(console.error);
    invoke('stop_karaoke').catch(console.error);
    setPlaybackBackend('mpv');
    setKaraokeMix(0);
    resetKaraokeAvailability();
    resetPlayerState();
  }, [resetKaraokeAvailability, resetPlayerState]);

  // Embed MPV on mount
  useEffect(() => {
    invoke('embed_mpv').catch(console.error);
  }, []);

  // Cleanup karaoke on unmount
  useEffect(() => {
    return () => {
      void invoke('stop_karaoke').catch(() => undefined);
    };
  }, []);

  // Reset karaoke state when the current song changes
  useEffect(() => {
    if (!currentSong?.id) {
      resetKaraokeAvailability();
    }

    setPlaybackBackend('mpv');
    setKaraokeMix(0);
    resetKaraokeAvailability();
    void invoke('stop_karaoke').catch(() => undefined);
  }, [currentSong?.id, resetKaraokeAvailability]);

  // Load the current song whenever it changes, or when the same song is re-selected.
  // playbackVersion acts as a monotonic reload trigger so the effect re-fires even when
  // currentSong is the same object reference (e.g. single-song REPEAT_ALL queue wraps around).
  // biome-ignore lint/correctness/useExhaustiveDependencies: playbackVersion is an intentional reload trigger, not a value consumed inside the callback
  useEffect(() => {
    void loadCurrentSong();
  }, [loadCurrentSong, playbackVersion]);

  // Poll playback status while a song is active
  useEffect(() => {
    if (!currentSong || !isShown) {
      return;
    }

    const interval = window.setInterval(() => {
      void getActivePlaybackStatus()
        .then(processPlaybackStatus)
        .catch((error) => {
          console.error('Music playback health check failed:', error);
        });
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentSong, getActivePlaybackStatus, isShown, processPlaybackStatus]);

  return {
    isKaraokeActive: playbackBackend === 'karaoke',
    isKaraokeAvailable: Boolean(karaokeStemUrls),
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
  };
}
