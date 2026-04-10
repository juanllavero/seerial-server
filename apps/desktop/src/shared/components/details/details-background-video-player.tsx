import { getSignedVideoStreamUrlPassthrough } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSettingsStore } from '@/features/settings/stores/settings.store';
import { useAppSettingsMpv } from '@/pages/videoplayer/hooks/use-app-settings-mpv';
import {
  enqueueMpvCommand,
  fadeOutAndStopMpv,
  getBackgroundPlaybackVolume,
  resetAppShellBackground,
  setAppShellBackground,
  waitForMediaReady,
} from './details-background-mpv';

const LOAD_TIMEOUT_MS = 5000;
const PLAYER_HEALTH_POLL_INTERVAL_MS = 500;
const VIDEO_REVEAL_DELAY_MS = 1250;

interface PlaybackStatus {
  eofReached: boolean;
}

interface DetailsBackgroundVideoPlayerProps {
  localId: string;
  onEnded?: () => void;
  onUnavailable?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

function DetailsBackgroundVideoPlayer({
  localId,
  onEnded,
  onUnavailable,
  onVisibilityChange,
}: DetailsBackgroundVideoPlayerProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const { hardwareDecoding, themeMusicVolume } = useSettingsStore((state) => ({
    hardwareDecoding: state.settings.hardwareDecoding,
    themeMusicVolume: state.settings.themeMusicVolume,
  }));

  useAppSettingsMpv();

  const isDisposedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const loadAttemptRef = useRef(0);
  const revealTimerRef = useRef<number | null>(null);
  const originalVolumeRef = useRef<number>(100);

  const targetVolume = useMemo(
    () => getBackgroundPlaybackVolume(themeMusicVolume),
    [themeMusicVolume],
  );

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    clearRevealTimer();
    onVisibilityChange?.(false);
    setAppShellBackground('opaque');

    await enqueueMpvCommand(async () => {
      await fadeOutAndStopMpv(originalVolumeRef.current, () => false);
      await invoke('set_hwdec', { enabled: hardwareDecoding }).catch(() => undefined);
    });
  }, [clearRevealTimer, hardwareDecoding, onVisibilityChange]);

  const loadAndPlay = useCallback(async () => {
    if (!localId || !serverUrl) {
      return false;
    }

    const currentAttempt = ++loadAttemptRef.current;

    try {
      await enqueueMpvCommand(async () => {
        try {
          originalVolumeRef.current = await invoke<number>('get_volume');
        } catch {
          originalVolumeRef.current = 100;
        }

        const signedUrl = await getSignedVideoStreamUrlPassthrough({
          filePath: 'none',
          localId,
          expiresIn: '10m',
        });

        if (!signedUrl || isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
          throw new Error('Background video is not available');
        }

        await invoke('embed_mpv');
        await invoke('set_hwdec', { enabled: false });
        await invoke('set_volume', { volume: targetVolume });
        await invoke('load_url', { url: `${serverUrl}${signedUrl}` });
      });

      const ready = await waitForMediaReady(LOAD_TIMEOUT_MS, () => {
        return isDisposedRef.current || currentAttempt !== loadAttemptRef.current;
      });

      if (!ready || isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
        throw new Error('Background video timed out');
      }

      await enqueueMpvCommand(async () => {
        if (isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
          return;
        }

        await invoke('play');
      });

      clearRevealTimer();
      revealTimerRef.current = window.setTimeout(() => {
        if (isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
          return;
        }

        setAppShellBackground('video-overlay');
        onVisibilityChange?.(true);
      }, VIDEO_REVEAL_DELAY_MS);

      return true;
    } catch {
      clearRevealTimer();
      onVisibilityChange?.(false);

      if (!isDisposedRef.current && currentAttempt === loadAttemptRef.current) {
        onUnavailable?.();
      }

      return false;
    }
  }, [clearRevealTimer, localId, onUnavailable, onVisibilityChange, serverUrl, targetVolume]);

  useEffect(() => {
    isDisposedRef.current = false;
    hasEndedRef.current = false;
    onVisibilityChange?.(false);
    setAppShellBackground('opaque');

    if (!localId || !serverUrl) {
      return () => {
        isDisposedRef.current = true;
        resetAppShellBackground();
      };
    }

    void loadAndPlay();

    return () => {
      isDisposedRef.current = true;
      resetAppShellBackground();
      void stopPlayback();
    };
  }, [loadAndPlay, localId, onVisibilityChange, serverUrl, stopPlayback]);

  useEffect(() => {
    if (!localId || !serverUrl) {
      return;
    }

    const interval = window.setInterval(() => {
      void invoke<PlaybackStatus>('get_playback_status')
        .then((status) => {
          if (!status.eofReached || hasEndedRef.current || isDisposedRef.current) {
            return;
          }

          hasEndedRef.current = true;
          onVisibilityChange?.(false);
          void stopPlayback().finally(() => {
            if (!isDisposedRef.current) {
              onEnded?.();
            }
          });
        })
        .catch(() => undefined);
    }, PLAYER_HEALTH_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearRevealTimer();
    };
  }, [clearRevealTimer, localId, onEnded, onVisibilityChange, serverUrl, stopPlayback]);

  return null;
}

export default DetailsBackgroundVideoPlayer;
