import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { getSignedSongStreamUrl, useGetSongLyrics } from '@seerial/api';
import type { LyricsLine } from '@seerial/domain';
import { useMusicStore, useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
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
import MusicPlayerControls from './music-player-controls';

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

function getKaraokeMixVolumes(mixValue: number): {
  instrumental: number;
  vocals: number;
} {
  const clampedValue = clampKaraokeMix(mixValue);

  if (clampedValue < 0) {
    return {
      instrumental: 1,
      vocals: (10 + clampedValue) / 10,
    };
  }

  if (clampedValue > 0) {
    return {
      instrumental: (10 - clampedValue) / 10,
      vocals: 1,
    };
  }

  return {
    instrumental: 1,
    vocals: 1,
  };
}

function useKaraokeAvailability(
  songFileSrc: string | undefined,
  serverUrl: string,
  isShown: boolean,
  onUnavailable: () => void,
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
      onUnavailable();
    },
    [onUnavailable],
  );

  const resolveKaraokeStems = useCallback(async () => {
    if (!songFileSrc || !serverUrl || !isShown) {
      setKaraokeStemUrls(null);
      setIsKaraokePreparing(false);
      setIsKaraokeReady(false);
      return;
    }

    const currentAttempt = ++karaokeAvailabilityAttemptRef.current;
    const instrumentalPath = replaceSongExtension(songFileSrc, '.inst.flac');
    const vocalsPath = replaceSongExtension(songFileSrc, '.vocals.flac');

    const [instrumentalResult, vocalsResult] = await Promise.allSettled([
      getSignedSongStreamUrl({
        filePath: instrumentalPath,
        expiresIn: '10m',
        isDesktop: true,
      }),
      getSignedSongStreamUrl({
        filePath: vocalsPath,
        expiresIn: '10m',
        isDesktop: true,
      }),
    ]);

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
      onUnavailable();
      return;
    }

    setKaraokeStemUrls({
      instrumental: `${serverUrl}${instrumentalResult.value}`,
      vocals: `${serverUrl}${vocalsResult.value}`,
    });
    setIsKaraokePreparing(true);
    setIsKaraokeReady(false);
  }, [isShown, onUnavailable, serverUrl, songFileSrc]);

  const handlePolledPreloadStatus = useCallback(
    (status: KaraokePreloadStatus): boolean => {
      if (!status.matchesRequest) {
        return false;
      }

      if (status.isLoading) {
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
      handleNext: state.handleNext,
    }),
    shallow,
  );

  const loadAttemptRef = useRef(0);
  const eofGuardRef = useRef(false);
  const currentSongId = currentSong?.id;
  const [playbackBackend, setPlaybackBackend] = useState<PlaybackBackend>('mpv');
  const [karaokeMix, setKaraokeMix] = useState(0);
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
  const handleKaraokeUnavailable = useCallback(() => {
    setShowKaraokeMixer(false);
  }, []);

  const {
    karaokeStemUrls,
    isKaraokePreparing,
    isKaraokeReady,
    shouldShowKaraokeButton,
    resetKaraokeAvailability,
  } = useKaraokeAvailability(currentSong?.fileSrc, serverUrl, isShown, handleKaraokeUnavailable);

  const isKaraokeActive = playbackBackend === 'karaoke';
  const isKaraokeAvailable = Boolean(karaokeStemUrls);

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

        await invoke('set_karaoke_mix', {
          instVol: instrumental,
          voiceVol: vocals,
        });
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
    invoke('embed_mpv').catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      void invoke('stop_karaoke').catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!currentSong?.id) {
      resetKaraokeAvailability();
    }

    setPlaybackBackend('mpv');
    setKaraokeMix(0);
    setShowKaraokeMixer(false);
    setIsQueueMenuOpen(false);
    resetKaraokeAvailability();
    void invoke('stop_karaoke').catch(() => undefined);
  }, [currentSong?.id, resetKaraokeAvailability]);

  useEffect(() => {
    void loadCurrentSong();
  }, [loadCurrentSong]);

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

  const handleStop = useCallback(() => {
    invoke('stop').catch(console.error);
    invoke('stop_karaoke').catch(console.error);
    setPlaybackBackend('mpv');
    setKaraokeMix(0);
    setShowKaraokeMixer(false);
    resetKaraokeAvailability();
    resetPlayerState();

    window.setTimeout(() => {
      setFocus(NavigationFocusKeys.topBar.settings);
    }, 280);
  }, [resetKaraokeAvailability, resetPlayerState]);

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
