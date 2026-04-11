import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { getSignedSongStreamUrl, useGetSongLyrics } from '@seerial/api';
import type { LRCFile } from '@seerial/domain';
import { useMusicStore, useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Languages,
  MicVocal,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  SquareIcon,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';
import { Slider } from '@/components/ui/slider';
import LRCVisualizer from '@/features/music-player/lrc-visualizer';
import LyricsOptionsMenu from '@/features/music-player/lyrics-options-menu';
import { classifyLyricsFiles, formatLanguageLabel } from '@/features/music-player/lyrics-utils';
import TimelineSlider from '@/pages/videoplayer/components/controls/timeline-slider';
import Loading from '@/shared/components/loading';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

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

interface KaraokeMixSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
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

function getKaraokeMixVolumes(mixValue: number): { instrumental: number; vocals: number } {
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
      className={`w-full max-w-[46vh] rounded-[2.5vh] border px-[2.4vh] py-[1.8vh] backdrop-blur-md transition-all duration-200 ${focused ? 'border-white/90 bg-black/55 shadow-lg shadow-black/30' : 'border-white/20 bg-black/30'}`}
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
    <span className="inline-block h-[2.2dvh] w-[2.2dvh] animate-spin rounded-full border-r-2 border-t-2 border-r-transparent border-t-current" />
  );
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
  showLyrics: boolean,
  setShowLyrics: (showLyrics: boolean) => void,
) {
  const { data: lyrics = [], isLoading: isLyricsLoading } = useGetSongLyrics<LRCFile[]>(
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

function useLyricsDisplayOptions(
  lyrics: LRCFile[],
  isLyricsLoading: boolean,
  showLyrics: boolean,
  currentSongId: string | undefined,
  userLanguage: string,
  t: (key: string) => string,
) {
  const [showPronunciation, setShowPronunciation] = useState<boolean | null>(null);
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState<
    string | null | undefined
  >(undefined);
  const [isLyricsOptionsOpen, setIsLyricsOptionsOpen] = useState(false);
  const previousSongIdRef = useRef<string | undefined>(undefined);

  const classifiedLyrics = useMemo(() => classifyLyricsFiles(lyrics), [lyrics]);
  const translationOptions = useMemo(
    () =>
      classifiedLyrics.translations.map((lyric) => ({
        language: lyric.language,
        label: formatLanguageLabel(
          lyric.language,
          userLanguage,
          t('originalLanguage'),
          t('lyricsPronunciation'),
        ),
      })),
    [classifiedLyrics.translations, t, userLanguage],
  );

  const hasPronunciation = classifiedLyrics.pronunciation !== null;
  const hasTranslationOptions = translationOptions.length > 0;
  const isLyricsOptionsButtonDisabled = !hasPronunciation && !hasTranslationOptions;

  useEffect(() => {
    if (previousSongIdRef.current === currentSongId) {
      return;
    }

    previousSongIdRef.current = currentSongId;
    setShowPronunciation(null);
    setSelectedTranslationLanguage(undefined);
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
    if (isLyricsLoading) {
      return;
    }

    if (translationOptions.length === 0) {
      setSelectedTranslationLanguage(null);
      return;
    }

    if (selectedTranslationLanguage === undefined) {
      setSelectedTranslationLanguage(translationOptions[0].language);
      return;
    }

    if (
      selectedTranslationLanguage !== null &&
      !translationOptions.some((option) => option.language === selectedTranslationLanguage)
    ) {
      setSelectedTranslationLanguage(translationOptions[0].language);
    }
  }, [isLyricsLoading, selectedTranslationLanguage, translationOptions]);

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
    selectedTranslationLanguage,
    isLyricsOptionsOpen,
    translationOptions,
    hasPronunciation,
    isLyricsOptionsButtonDisabled,
    setShowPronunciation,
    setSelectedTranslationLanguage,
    setIsLyricsOptionsOpen,
    closeLyricsOptions,
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: coordinates playback lifecycle, focus management, and overlay controls in one container.
function GlobalMusicPlayer() {
  const { t, i18n } = useTranslation();
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
  const currentSongId = currentSong?.id;
  const [playbackBackend, setPlaybackBackend] = useState<PlaybackBackend>('mpv');
  const [karaokeMix, setKaraokeMix] = useState(0);
  const [showKaraokeMixer, setShowKaraokeMixer] = useState(false);
  const { lyrics, isLyricsLoading, hasLyrics, shouldShowLyricsPanel, isLyricsButtonDisabled } =
    useSongLyricsPanel(currentSongId, isShown, showLyrics, setShowLyrics);
  const {
    showPronunciation,
    selectedTranslationLanguage,
    isLyricsOptionsOpen,
    translationOptions,
    hasPronunciation,
    isLyricsOptionsButtonDisabled,
    setShowPronunciation,
    setSelectedTranslationLanguage,
    setIsLyricsOptionsOpen,
    closeLyricsOptions,
  } = useLyricsDisplayOptions(lyrics, isLyricsLoading, showLyrics, currentSongId, i18n.language, t);
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
    enabled: isShown && isExpanded && !isLyricsOptionsOpen,
    preAction: hideExpandedPlayer,
    navigateOnBack: false,
  });

  useKeyboardBack({
    enabled: isShown && isExpanded && isLyricsOptionsOpen,
    preAction: () => closeLyricsOptions(),
    navigateOnBack: false,
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
  }, [isKaraokeAvailable, isKaraokeReady, showKaraokeMixer]);

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
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-120 bg-black"
        >
          <GradientBackground imageSrc={album?.coverSrc ?? ''} />
          <NavigationContainer
            customFocusKey="music-player-overlay"
            className="relative h-full w-full overflow-hidden"
          >
            <div className="flex h-full w-full justify-center">
              <FlexBox direction="column" gap={6} width="100%" justify="end" align="center">
                <FlexBox
                  gap={3}
                  width="100%"
                  align="center"
                  justify="center"
                  className="relative overflow-hidden"
                >
                  <div
                    className={`relative h-screen z-1 flex items-center justify-center 
                      transition-all duration-300 ease-in-out
                      ${shouldShowLyricsPanel ? 'translate-x-20' : ''}`}
                    style={{ width: shouldShowLyricsPanel ? '40dvw' : '100%' }}
                  >
                    <FlexBox direction="column" gap={2} align="center">
                      <Image
                        url={album?.coverSrc ?? ''}
                        className="rounded-3xl"
                        width="50vh"
                        height="50vh"
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
                        className="relative z-0 min-h-0 min-w-0 flex-1 self-stretch overflow-hidden"
                      >
                        <LRCVisualizer
                          lyrics={lyrics}
                          isLoading={isLyricsLoading}
                          showPronunciation={Boolean(showPronunciation)}
                          selectedTranslationLanguage={selectedTranslationLanguage ?? null}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FlexBox>
              </FlexBox>

              <div className="pointer-events-none absolute inset-x-0 bottom-[5vh] z-30 flex justify-center px-[4vh]">
                <div className="pointer-events-auto w-full max-w-[160dvh]">
                  {!!isLoading && (
                    <div className="mb-[2vh] flex h-[7dvh] justify-center">
                      <Loading />
                    </div>
                  )}

                  <FlexBox
                    direction="column"
                    gap={1}
                    align="center"
                    width="100%"
                    className="rounded-[3vh] px-[3vh] py-[2vh]"
                  >
                    <TimelineSlider
                      position={currentTime}
                      setPosition={setCurrentTime}
                      duration={playerDuration}
                      setDuration={setDuration}
                      togglePlayPause={togglePlayPause}
                      playbackControls={{
                        getPosition: getActivePlaybackPosition,
                        getDuration: getActivePlaybackDuration,
                        setPosition: setActivePlaybackPosition,
                      }}
                    />

                    <AnimatePresence initial={false}>
                      {showKaraokeMixer && isKaraokeAvailable && (
                        <motion.div
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
                        </motion.div>
                      )}
                    </AnimatePresence>

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
                        onClick={() => {
                          if (showLyrics) {
                            setIsLyricsOptionsOpen(false);
                          }

                          setShowLyrics(!showLyrics);
                        }}
                      />
                      <div className="relative">
                        <NavigationButton
                          customKey={NavigationFocusKeys.player.lyricsOptionsButton}
                          title={t('lyricsOptions')}
                          icon={<Languages size={'2dvh'} />}
                          hideText
                          variant="ghost"
                          selected={isLyricsOptionsOpen}
                          disabled={isLyricsOptionsButtonDisabled || !hasLyrics}
                          onClick={() => {
                            setIsLyricsOptionsOpen((currentValue) => !currentValue);
                          }}
                        />

                        <AnimatePresence initial={false}>
                          {isLyricsOptionsOpen && !isLyricsOptionsButtonDisabled && !!hasLyrics && (
                            <motion.div
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
                                pronunciationLabel={t('lyricsPronunciation')}
                                translationLabel={t('lyricsTranslation')}
                                offLabel={t('lyricsOff')}
                                hasPronunciation={hasPronunciation}
                                showPronunciation={Boolean(showPronunciation)}
                                translationOptions={translationOptions}
                                selectedTranslationLanguage={selectedTranslationLanguage ?? null}
                                onTogglePronunciation={() => {
                                  setShowPronunciation((currentValue) => !Boolean(currentValue));
                                }}
                                onSelectTranslation={setSelectedTranslationLanguage}
                                onClose={() => closeLyricsOptions()}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                      {!!shouldShowKaraokeButton && (
                        <NavigationButton
                          customKey={NavigationFocusKeys.player.karaokeButton}
                          title={t('karaokeMix')}
                          icon={
                            isKaraokePreparing ? (
                              <KaraokeLoadingIcon />
                            ) : (
                              <SlidersHorizontal size={'2dvh'} />
                            )
                          }
                          hideText
                          variant="ghost"
                          selected={showKaraokeMixer || isKaraokeActive}
                          disabled={!isKaraokeReady}
                          onClick={toggleKaraokeMixer}
                        />
                      )}
                    </FlexBox>
                  </FlexBox>
                </div>
              </div>
            </div>
          </NavigationContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalMusicPlayer);
